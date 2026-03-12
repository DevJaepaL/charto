import AdmZip from "adm-zip";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const snapshotPath = path.join(rootDir, "src", "data", "stocks-snapshot.json");
const outputPath = path.join(rootDir, "src", "data", "company-context.generated.json");
const corpCodeOutputPath = path.join(rootDir, "src", "data", "dart-corp-codes.generated.json");
const dotenvPath = path.join(rootDir, ".env");

const CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml";
const COMPANY_URL = "https://opendart.fss.or.kr/api/company.json";
const FLUSH_INTERVAL = 50;
const CONCURRENCY = Math.max(1, Number(process.env.DART_SYNC_CONCURRENCY ?? 3));
const USER_AGENT = "Charto Company Context Sync/1.0";

function compactWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseDotEnv(content) {
  const entries = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries.push([key, value]);
  }

  return entries;
}

async function loadDotEnv(filePath) {
  try {
    const content = await readFile(filePath, "utf8");

    for (const [key, value] of parseDotEnv(content)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env file. The script can still run with shell environment variables.
  }
}

function getOpenDartApiKey() {
  return (
    process.env.OPENDART_API_KEY?.trim() ||
    process.env.OPEN_DART_API_KEY?.trim() ||
    process.env.DART_API_KEY?.trim() ||
    ""
  );
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`${url} 요청 실패 (${response.status})`);
  }

  return response.json();
}

function extractTagValue(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`));
  return match?.[1]?.trim() ?? "";
}

function parseCorpCodeMap(xml) {
  const map = new Map();

  for (const match of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const block = match[1];
    const stockCode = extractTagValue(block, "stock_code");
    const corpCode = extractTagValue(block, "corp_code");
    const corpName = compactWhitespace(decodeXmlEntities(extractTagValue(block, "corp_name")));

    if (!stockCode || !corpCode || !/^\d{6}$/.test(stockCode)) {
      continue;
    }

    map.set(stockCode, { corpCode, corpName });
  }

  return map;
}

async function withRetry(task, label) {
  let lastError = null;

  for (const waitMs of [0, 400, 1200]) {
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    try {
      return await task();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /(429|500|502|503|504|timed out|network|fetch failed)/i.test(message);

      if (!retryable) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error(`${label} 요청 실패`);
}

async function fetchCorpCodeMap(apiKey) {
  const response = await withRetry(
    () =>
      fetch(`${CORP_CODE_URL}?crtfc_key=${encodeURIComponent(apiKey)}`, {
        headers: {
          "user-agent": USER_AGENT,
        },
      }),
    "corpCode",
  );

  if (!response.ok) {
    throw new Error(`corpCode.xml 요청 실패 (${response.status})`);
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(zipBuffer);
  const entry = zip
    .getEntries()
    .find((candidate) => candidate.entryName.toLowerCase().endsWith("corpcode.xml"));

  if (!entry) {
    throw new Error("corpCode.xml 응답을 해석하지 못했습니다.");
  }

  return parseCorpCodeMap(entry.getData().toString("utf8"));
}

async function fetchCompanyOverview(apiKey, corpCode) {
  const payload = await withRetry(
    () =>
      fetchJson(
        `${COMPANY_URL}?crtfc_key=${encodeURIComponent(apiKey)}&corp_code=${encodeURIComponent(corpCode)}`,
      ),
    `company:${corpCode}`,
  );

  if (payload.status !== "000") {
    return null;
  }

  const indutyCode = payload.induty_code?.trim();
  if (!indutyCode) {
    return null;
  }

  return {
    indutyCode,
    corpCls: payload.corp_cls?.trim() || null,
  };
}

async function loadStocks() {
  return JSON.parse(await readFile(snapshotPath, "utf8"));
}

async function loadExistingManifest() {
  try {
    const parsed = JSON.parse(await readFile(outputPath, "utf8"));
    return {
      generatedAt: parsed.generatedAt || "",
      source: parsed.source || "opendart",
      items: parsed.items && typeof parsed.items === "object" ? parsed.items : {},
    };
  } catch {
    return {
      generatedAt: "",
      source: "opendart",
      items: {},
    };
  }
}

async function loadExistingCorpCodeManifest() {
  try {
    const parsed = JSON.parse(await readFile(corpCodeOutputPath, "utf8"));
    const items = parsed.items && typeof parsed.items === "object" ? parsed.items : {};
    const map = new Map();

    for (const [stockCode, corpCode] of Object.entries(items)) {
      if (!stockCode || typeof corpCode !== "string" || !corpCode.trim()) {
        continue;
      }

      map.set(stockCode, { corpCode: corpCode.trim(), corpName: "" });
    }

    return {
      generatedAt: parsed.generatedAt || "",
      map,
    };
  } catch {
    return {
      generatedAt: "",
      map: new Map(),
    };
  }
}

async function writeManifest(manifest) {
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function writeCorpCodeManifest(map, generatedAt) {
  const items = {};

  for (const [stockCode, value] of map.entries()) {
    items[stockCode] = value.corpCode;
  }

  await writeFile(
    corpCodeOutputPath,
    `${JSON.stringify({ generatedAt, source: "opendart", items }, null, 2)}\n`,
    "utf8",
  );
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function main() {
  await loadDotEnv(dotenvPath);
  const apiKey = getOpenDartApiKey();

  if (!apiKey) {
    throw new Error("OPENDART_API_KEY가 없습니다.");
  }

  const generatedAt = new Date().toISOString();
  const [stocks, manifest, cachedCorpCodes] = await Promise.all([
    loadStocks(),
    loadExistingManifest(),
    loadExistingCorpCodeManifest(),
  ]);
  const items = manifest.items;
  let corpCodeMap = cachedCorpCodes.map;

  if (cachedCorpCodes.map.size > 0) {
    try {
      const freshCorpCodes = await fetchCorpCodeMap(apiKey);
      if (freshCorpCodes.size > corpCodeMap.size) {
        corpCodeMap = freshCorpCodes;
        await writeCorpCodeManifest(corpCodeMap, generatedAt);
      }
    } catch {
      // Keep using the last saved corp code cache.
    }
  } else {
    corpCodeMap = await fetchCorpCodeMap(apiKey);
    await writeCorpCodeManifest(corpCodeMap, generatedAt);
  }

  const syncableStocks = stocks.filter((stock) => corpCodeMap.has(stock.symbol));
  const pendingStocks = syncableStocks.filter((stock) => {
    const cached = items[stock.symbol];
    return !cached?.indutyCode;
  });
  const unresolvedCount = stocks.length - syncableStocks.length;

  let completed = syncableStocks.length - pendingStocks.length;
  let flushed = completed;
  const failures = new Map();

  console.log(
    `총 ${stocks.length}개 종목 중 ${pendingStocks.length}개를 동기화합니다. (${syncableStocks.length}개가 corp code 캐시에 연결됨)`,
  );

  for (const stockGroup of chunk(pendingStocks, CONCURRENCY)) {
    const results = await Promise.allSettled(
      stockGroup.map(async (stock) => {
        const corpInfo = corpCodeMap.get(stock.symbol);
        if (!corpInfo) {
          return;
        }

        const overview = await fetchCompanyOverview(apiKey, corpInfo.corpCode);
        if (!overview) {
          return;
        }

        items[stock.symbol] = {
          corpCode: corpInfo.corpCode,
          corpName: corpInfo.corpName || stock.name,
          corpCls: overview.corpCls,
          indutyCode: overview.indutyCode,
          updatedAt: generatedAt,
        };
      }),
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        return;
      }

      failures.set(stockGroup[index].symbol, result.reason instanceof Error ? result.reason.message : String(result.reason));
    });

    completed += stockGroup.length;

    if (completed - flushed >= FLUSH_INTERVAL) {
      await writeManifest({
        generatedAt,
        source: "opendart",
        items,
      });
      flushed = completed;
      console.log(`진행률 ${completed}/${syncableStocks.length}`);
    }
  }

  await writeManifest({
    generatedAt,
    source: "opendart",
    items,
  });

  console.log(`완료: ${Object.keys(items).length}개 종목 메타데이터 저장`);
  if (unresolvedCount > 0) {
    console.log(`corp code 미확보 종목 ${unresolvedCount}개는 다음 재시도 때 이어서 처리합니다.`);
  }

  if (failures.size > 0) {
    console.log(`실패 ${failures.size}건은 건너뛰었습니다. 다시 실행하면 이어서 동기화합니다.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
