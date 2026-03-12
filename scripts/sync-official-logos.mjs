import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import AdmZip from "adm-zip";
import { JSDOM } from "jsdom";

const ROOT = process.cwd();
const SNAPSHOT_PATH = path.join(ROOT, "src", "data", "stocks-snapshot.json");
const MANIFEST_PATH = path.join(ROOT, "src", "data", "logo-manifest.generated.json");
const LOGO_DIR = path.join(ROOT, "public", "logos", "official");
const USER_AGENT =
  "Mozilla/5.0 (compatible; ChartoLogoSync/1.0; +https://charto.local)";

async function readEnvFileVariable(name) {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env"), "utf8");
    const line = text
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${name}=`));

    if (!line) {
      return "";
    }

    return line.slice(line.indexOf("=") + 1).trim();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

function parseArgs(argv) {
  const options = {
    symbols: [],
    limit: 20,
    overwrite: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--symbols=")) {
      options.symbols = arg
        .slice("--symbols=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length));
      if (Number.isFinite(value) && value > 0) {
        options.limit = value;
      }
      continue;
    }

    if (arg === "--overwrite") {
      options.overwrite = true;
    }
  }

  return options;
}

async function readJson(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallbackValue;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(filePath, serialized, "utf8");
}

function extractTagValue(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`));
  return match?.[1]?.trim() ?? "";
}

function parseCorpCodeMap(xml) {
  const mapping = new Map();

  for (const match of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const block = match[1];
    const stockCode = extractTagValue(block, "stock_code");
    const corpCode = extractTagValue(block, "corp_code");
    const corpName = extractTagValue(block, "corp_name");

    if (!/^\d{6}$/.test(stockCode) || !corpCode) {
      continue;
    }

    mapping.set(stockCode, {
      corpCode,
      corpName,
    });
  }

  return mapping;
}

async function fetchCorpCodeMap(apiKey) {
  const response = await fetch(
    `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${encodeURIComponent(apiKey)}`,
    {
      headers: {
        "user-agent": USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`corpCode.xml fetch failed: ${response.status}`);
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(zipBuffer);
  const entry = zip
    .getEntries()
    .find((candidate) => candidate.entryName.toLowerCase().endsWith("corpcode.xml"));

  if (!entry) {
    throw new Error("corpCode.xml not found in OpenDART zip response");
  }

  return parseCorpCodeMap(entry.getData().toString("utf8"));
}

async function fetchCompanyOverview(apiKey, corpCode) {
  const response = await fetch(
    `https://opendart.fss.or.kr/api/company.json?crtfc_key=${encodeURIComponent(apiKey)}&corp_code=${encodeURIComponent(corpCode)}`,
    {
      headers: {
        "user-agent": USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`company.json fetch failed: ${response.status}`);
  }

  const payload = await response.json();

  if (payload.status !== "000") {
    throw new Error(payload.message || `OpenDART error ${payload.status}`);
  }

  return payload;
}

function normalizeHomepageCandidates(rawUrl) {
  const cleaned = String(rawUrl ?? "").trim().replace(/\/+$/, "");

  if (!cleaned || cleaned === "-" || cleaned === "없음") {
    return [];
  }

  if (/^https?:\/\//i.test(cleaned)) {
    return [cleaned];
  }

  return [`https://${cleaned}`, `http://${cleaned}`];
}

function resolveUrl(baseUrl, maybeRelative) {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

function scoreCandidate(candidateUrl, source, attributeText, sameOrigin) {
  let score = 0;
  const lowerUrl = candidateUrl.toLowerCase();
  const lowerSource = source.toLowerCase();
  const lowerAttr = attributeText.toLowerCase();

  if (lowerUrl.endsWith(".svg")) {
    score += 90;
  } else if (/\.(png|webp)$/.test(lowerUrl)) {
    score += 45;
  } else if (/\.(jpg|jpeg)$/.test(lowerUrl)) {
    score += 20;
  }

  if (/logo|brand|ci|symbol/.test(lowerUrl)) {
    score += 28;
  }

  if (/logo|brand|ci|symbol/.test(lowerAttr)) {
    score += 22;
  }

  if (lowerSource.includes("logo-container")) {
    score += 30;
  }

  if (sameOrigin) {
    score += 10;
  }

  if (lowerSource.includes("og:logo")) {
    score += 24;
  }

  if (lowerSource.includes("og:image")) {
    score += 12;
  }

  if (lowerSource.includes("header")) {
    score += 12;
  }

  if (lowerSource.includes("icon")) {
    score -= 12;
  }

  if (lowerUrl.includes("favicon")) {
    score -= 25;
  }

  if (/banner|popup|hero|maintenance|search|system|poster|visual|tmp|video/.test(lowerUrl)) {
    score -= 55;
  }

  if (/banner|popup|hero|maintenance|search|system|poster|visual|tmp|video/.test(lowerAttr)) {
    score -= 45;
  }

  return score;
}

function collectLogoCandidates(html, homepageUrl) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const homepageOrigin = new URL(homepageUrl).origin;
  const candidates = [];
  const dedupe = new Map();

  function addCandidate(url, source, attributeText = "") {
    const resolved = resolveUrl(homepageUrl, url);
    if (!resolved) {
      return;
    }

    const score = scoreCandidate(
      resolved,
      source,
      attributeText,
      new URL(resolved).origin === homepageOrigin,
    );

    const existing = dedupe.get(resolved);
    if (existing && existing.score >= score) {
      return;
    }

    const candidate = {
      url: resolved,
      source,
      score,
    };

    dedupe.set(resolved, candidate);
  }

  for (const meta of document.querySelectorAll(
    'meta[property="og:logo"], meta[property="og:image"], meta[name="twitter:image"]',
  )) {
    const content = meta.getAttribute("content");
    if (content) {
      addCandidate(content, meta.getAttribute("property") ?? meta.getAttribute("name") ?? "meta");
    }
  }

  for (const link of document.querySelectorAll('link[rel]')) {
    const rel = link.getAttribute("rel") ?? "";
    if (!/(icon|logo|mask-icon|apple-touch-icon)/i.test(rel)) {
      continue;
    }
    const href = link.getAttribute("href");
    if (href) {
      addCandidate(href, `link:${rel}`);
    }
  }

  for (const element of document.querySelectorAll("img[src], source[srcset]")) {
    const src = element.getAttribute("src") ?? element.getAttribute("srcset");
    if (!src) {
      continue;
    }

    const inLogoContainer = Boolean(
      element.closest('[class*="logo"], [id*="logo"], [class*="brand"], [id*="brand"]'),
    );

    const tokens = [
      element.getAttribute("alt") ?? "",
      element.getAttribute("title") ?? "",
      element.getAttribute("class") ?? "",
      element.getAttribute("id") ?? "",
      src,
      inLogoContainer ? "logo-container" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (/banner|popup|hero|maintenance|search|system|poster|visual|video/i.test(tokens)) {
      continue;
    }

    if (!inLogoContainer && !/(logo|brand|ci|symbol)/i.test(tokens)) {
      continue;
    }

    addCandidate(src.split(/\s+/)[0], "img", tokens);
  }

  addCandidate("/favicon.ico", "fallback:favicon");

  candidates.push(...dedupe.values());
  candidates.sort((left, right) => right.score - left.score);

  return candidates;
}

function extensionFromContentType(contentType, sourceUrl) {
  const normalizedType = (contentType ?? "").split(";")[0].trim().toLowerCase();

  switch (normalizedType) {
    case "image/svg+xml":
      return ".svg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/jpeg":
      return ".jpg";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return ".ico";
    default: {
      const pathname = new URL(sourceUrl).pathname.toLowerCase();
      if (pathname.endsWith(".svg")) return ".svg";
      if (pathname.endsWith(".png")) return ".png";
      if (pathname.endsWith(".webp")) return ".webp";
      if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return ".jpg";
      if (pathname.endsWith(".ico")) return ".ico";
      return null;
    }
  }
}

async function downloadAsset(candidateUrl) {
  const response = await fetch(candidateUrl, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "image/svg+xml,image/webp,image/png,image/*;q=0.8,*/*;q=0.5",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`asset fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error("candidate resolved to HTML instead of image");
  }

  const extension = extensionFromContentType(contentType, response.url);
  if (!extension) {
    throw new Error(`unsupported content-type: ${contentType}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 256) {
    throw new Error("asset too small to trust");
  }

  return {
    buffer,
    contentType,
    extension,
    finalUrl: response.url,
  };
}

function selectTargetStocks(snapshot, options, manifest) {
  const requested = options.symbols.length
    ? new Set(options.symbols)
    : null;

  return snapshot
    .filter((item) => /^\d{6}$/.test(item.symbol))
    .filter((item) => (requested ? requested.has(item.symbol) : true))
    .filter((item) => options.overwrite || !manifest[item.symbol])
    .slice(0, options.limit);
}

async function main() {
  const apiKey = process.env.OPENDART_API_KEY || (await readEnvFileVariable("OPENDART_API_KEY"));
  if (!apiKey) {
    console.error("OPENDART_API_KEY is required for official logo sync.");
    process.exitCode = 1;
    return;
  }

  const options = parseArgs(process.argv.slice(2));
  const snapshot = await readJson(SNAPSHOT_PATH, []);
  const manifest = await readJson(MANIFEST_PATH, {});
  const corpCodeMap = await fetchCorpCodeMap(apiKey);
  const targets = selectTargetStocks(snapshot, options, manifest);

  await fs.mkdir(LOGO_DIR, { recursive: true });

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const stock of targets) {
    const corpInfo = corpCodeMap.get(stock.symbol);
    if (!corpInfo) {
      console.log(`[skip] ${stock.symbol} ${stock.name} -> corp_code missing`);
      skipped += 1;
      continue;
    }

    try {
      const overview = await fetchCompanyOverview(apiKey, corpInfo.corpCode);
      const homepageCandidates = normalizeHomepageCandidates(overview.hm_url);

      if (!homepageCandidates.length) {
        throw new Error("homepage url missing in OpenDART company overview");
      }

      let homepageUrl = null;
      let homepageHtml = null;
      let homepageError = null;

      for (const candidate of homepageCandidates) {
        try {
          const homepageResponse = await fetch(candidate, {
            headers: {
              "user-agent": USER_AGENT,
              accept: "text/html,application/xhtml+xml",
            },
            redirect: "follow",
          });

          if (!homepageResponse.ok) {
            throw new Error(`homepage fetch failed: ${homepageResponse.status}`);
          }

          homepageUrl = homepageResponse.url;
          homepageHtml = await homepageResponse.text();
          break;
        } catch (error) {
          homepageError = error;
        }
      }

      if (!homepageUrl || !homepageHtml) {
        throw homepageError ?? new Error("homepage fetch failed");
      }

      const candidates = collectLogoCandidates(homepageHtml, homepageUrl);
      if (!candidates.length) {
        throw new Error("logo candidate not found on homepage");
      }

      let asset = null;
      let selectedCandidate = null;

      for (const candidate of candidates) {
        try {
          asset = await downloadAsset(candidate.url);
          selectedCandidate = candidate;
          break;
        } catch {
          continue;
        }
      }

      if (!asset || !selectedCandidate) {
        throw new Error("all logo candidates failed to download");
      }

      const assetPath = `/logos/official/${stock.symbol}${asset.extension}`;
      const filePath = path.join(LOGO_DIR, `${stock.symbol}${asset.extension}`);

      await fs.writeFile(filePath, asset.buffer);

      manifest[stock.symbol] = {
        logoSrc: assetPath,
        sourceUrl: asset.finalUrl,
        homepage: homepageUrl,
        fetchedAt: new Date().toISOString(),
        mimeType: asset.contentType.split(";")[0]?.trim() ?? asset.contentType,
      };

      await writeJson(MANIFEST_PATH, manifest);

      console.log(
        `[ok] ${stock.symbol} ${stock.name} -> ${assetPath} (${selectedCandidate.source}, score=${selectedCandidate.score})`,
      );
      synced += 1;
    } catch (error) {
      console.log(`[fail] ${stock.symbol} ${stock.name} -> ${error instanceof Error ? error.message : String(error)}`);
      failed += 1;
    }
  }

  console.log("");
  console.log(`done: synced=${synced}, skipped=${skipped}, failed=${failed}`);
  console.log(`manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
