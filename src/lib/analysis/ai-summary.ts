import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { resolveCompanyContext } from "@/lib/analysis/company-context.server";
import { AI_DISCLAIMER } from "@/lib/constants";
import type { AiSummary, CompanyContext, SignalSummary, StockLookupItem, TechnicalSnapshot } from "@/lib/types";

const aiResponseSchema = z.object({
  trend: z.string(),
  momentum: z.string(),
  levels: z.string(),
  business: z.string(),
  risk: z.string(),
  conclusion: z.string(),
});

const AI_RESPONSE_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    trend: { type: "STRING" },
    momentum: { type: "STRING" },
    levels: { type: "STRING" },
    business: { type: "STRING" },
    risk: { type: "STRING" },
    conclusion: { type: "STRING" },
  },
  required: ["trend", "momentum", "levels", "business", "risk", "conclusion"],
  propertyOrdering: ["trend", "momentum", "levels", "business", "risk", "conclusion"],
} as const;

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const AI_OUTPUT_TOKEN_BUDGETS = [240, 420] as const;
const AI_CACHE_SUCCESS_TTL_MS = 10 * 60 * 1000;
const AI_CACHE_FAILURE_TTL_MS = 60 * 1000;
const AI_CACHE_FORMAT_VERSION = 4;

const GEMINI_MODEL_ALIASES: Record<string, string> = {
  "gemini-3.1-pro": DEFAULT_GEMINI_MODEL,
  "gemini-3.1-pro-preview": DEFAULT_GEMINI_MODEL,
  "gemini-3-pro": DEFAULT_GEMINI_MODEL,
  "gemini-3-pro-preview": DEFAULT_GEMINI_MODEL,
  "gemini-2.5-flash": DEFAULT_GEMINI_MODEL,
};

let geminiKeyCursor = 0;
const aiSummaryCache = new Map<string, { expiresAt: number; summary: AiSummary }>();
const aiSummaryInflight = new Map<string, Promise<AiSummary>>();

function compactWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractLeadSentence(text: string) {
  const normalized = compactWhitespace(text);
  const sentence = normalized.match(/[^.!?]+[.!?]?/);

  return sentence?.[0]?.trim() || normalized;
}

function finalizeAiSentence(text: string) {
  let normalized = compactWhitespace(text)
    .replace(/[…]+$/g, "")
    .replace(/[,:;]\s*$/g, "")
    .trim();

  const replacements: Array<[RegExp, string]> = [
    [/(두어야|봐야|확인해야|고려해야|살펴봐야|주의해야|지켜봐야)\.?$/u, "$1 합니다."],
    [/(지양해야)\.?$/u, "지양하는 편이 좋습니다."],
    [/(보이고|이어지고|유지되고|강해지고|약해지고|둔화되고|확대되고|축소되고|개선되고)\.?$/u, "$1 있습니다."],
    [/(근접했으나|근접했지만)\.?$/u, "근접해 있습니다."],
    [/(상태|구간|흐름|추세|국면|우위|열위|가능성|부담|신호)\.?$/u, "$1입니다."],
  ];

  replacements.some(([pattern, replacement]) => {
    if (!pattern.test(normalized)) {
      return false;
    }

    normalized = normalized.replace(pattern, replacement);
    return true;
  });

  if (!/[.!?]$/u.test(normalized)) {
    normalized = normalized.endsWith("다") ? `${normalized}.` : `${normalized}입니다.`;
  }

  return normalized;
}

export function compactAiField(text: string, maxLength: number) {
  const normalized = finalizeAiSentence(extractLeadSentence(text));
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength).trim();
  const breakpoints = [clipped.lastIndexOf(","), clipped.lastIndexOf("·"), clipped.lastIndexOf(" ")];
  const safeIndex = Math.max(...breakpoints);
  const safeClip = safeIndex >= Math.floor(maxLength * 0.55) ? clipped.slice(0, safeIndex) : clipped;
  const trimmed = safeClip.trim().replace(/[,:;]$/g, "");

  return finalizeAiSentence(trimmed);
}

function normalizeAiPayload(payload: z.infer<typeof aiResponseSchema>) {
  return {
    trend: compactAiField(payload.trend, 52),
    momentum: compactAiField(payload.momentum, 48),
    levels: compactAiField(payload.levels, 44),
    business: compactAiField(payload.business, 58),
    risk: compactAiField(payload.risk, 50),
    conclusion: compactAiField(payload.conclusion, 58),
  };
}

function parseAiResponsePayload(text: string) {
  return normalizeAiPayload(
    aiResponseSchema.parse(JSON.parse(extractJson(text))),
  );
}

function buildPrompt(
  stock: StockLookupItem,
  technical: TechnicalSnapshot,
  signal: SignalSummary,
  companyContext: CompanyContext,
) {
  return `
너는 KOSPI & KOSDQ 주식 차트와 기업 및 해당 업종의 현재 추세 흐름을 파악하여 함께 설명하는 한국어 애널리스트다.
투자 권유가 아니라 기술적 지표와 기업·업종의 현 시점 흐름과 전망등을 해설만 한다.

입력 데이터:
- 종목명: ${stock.name}
- 종목코드: ${stock.symbol}
- 시장: ${stock.market}
- 자산 유형: ${companyContext.instrumentLabel}
- 분류 신뢰도: ${companyContext.confidence}
- 그룹 힌트: ${companyContext.group ?? "독립/일반 기업"}
- 업종 힌트: ${companyContext.sector}
- 기업 맥락 힌트: ${companyContext.businessSummary}
- 업계 흐름 힌트: ${companyContext.industryFlow}
- 포지션 힌트: ${companyContext.marketPosition}
- 보수 해석 메모: ${companyContext.cautionNote ?? "없음"}
- 현재가: ${technical.currentPrice}
- 등락률: ${technical.changePercent}
- SMA5: ${technical.sma5}
- SMA20: ${technical.sma20}
- SMA60: ${technical.sma60}
- EMA20: ${technical.ema20}
- RSI14: ${technical.rsi14}
- MACD: ${technical.macd}
- MACD Signal: ${technical.macdSignal}
- MACD Histogram: ${technical.macdHistogram}
- 볼린저 상단: ${technical.bollingerUpper}
- 볼린저 중단: ${technical.bollingerMiddle}
- 볼린저 하단: ${technical.bollingerLower}
- 볼린저 위치: ${technical.bollingerPosition}
- 거래량 상태: ${technical.volumeStatus}
- 지지선: ${technical.support}
- 저항선: ${technical.resistance}
- 종합 바이어스: ${signal.bias}
- 종합 점수: ${signal.score}
- 상승/하락 근거: ${signal.reasons.join(" | ")}
- 리스크: ${signal.risks.join(" | ")}

작성 규칙:
- 뉴스, 실적 발표, 공시, 목표주가처럼 입력에 없는 최신 사실은 단정하지 마라.
- trend, momentum, levels는 차트와 기술지표 중심을 잘 활용하여 작성한다.
- business는 그룹명과 업종명을 직접 넣고, 이 종목이 왜 그 업종 흐름의 영향을 받는지 1문장으로 쓴다.
- risk는 기술적 리스크와 함께 기업/업종 관점의 체크 포인트를 1~2문장으로 쓴다.
- conclusion은 기술 흐름 + 기업 평가를 함께 묶은 한줄 결론으로 쓴다.
- 문체는 딱딱한 리포트보다 앱에서 읽기 쉬운 자연스러운 한국어로 쓴다.
- 각 필드는 한 문장만 쓴다.
- 군더더기 수식어, 반복 표현, 배경 설명은 줄인다.
- 사용자가 카드에서 바로 읽을 수 있게 18~32자 안팎의 짧은 문장으로 쓴다.
- 숫자를 반복해서 길게 늘어놓지 말고, 핵심 판단만 남긴다.
- trend와 momentum은 서로 같은 표현을 반복하지 않는다.
- business는 기술적 분석이 아니라 기업·업종 관점만 설명한다.
- ETF·ETN이면 개별 기업 실적이나 업황 평가처럼 쓰지 말고, 기초자산과 상품 구조 관점으로 짧게 설명한다.
- 분류 신뢰도가 low면 단정형 표현을 피하고, 일반론 수준에서 짧게 설명한다.
- 보수 해석 메모가 있으면 risk나 conclusion에 그 취지를 반영한다.
- 모든 문장은 반드시 완결된 한국어 문장으로 끝낸다.
- 문장 끝은 합니다. 입니다. 있습니다. 형태로 마무리한다.
- 보이고, 두어야, 지양해야, 있으나처럼 미완성 어미로 끝내지 마라.

반드시 아래 JSON 필드만 채워라.
- trend: 추세 설명 1문장
- momentum: 모멘텀 설명 1문장
- levels: 지지/저항 설명 1문장
- business: 기업 및 업종 흐름 설명 1문장
- risk: 리스크 설명 1문장
- conclusion: 한줄 결론 1문장
`;
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const plain = text.match(/\{[\s\S]*\}/);
  return plain?.[0] ?? text;
}

function resolveGeminiModel(model: string) {
  return GEMINI_MODEL_ALIASES[model] ?? model;
}

function getGeminiApiKeys() {
  const single = process.env.GEMINI_API_KEY?.trim() ?? "";
  const multiple = (process.env.GEMINI_API_KEYS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...multiple, ...(single ? [single] : [])])];
}

export function getGeminiApiKeyCount() {
  return getGeminiApiKeys().length;
}

function getRotatedApiKeys(apiKeys: string[]) {
  if (apiKeys.length <= 1) {
    return apiKeys;
  }

  const startIndex = geminiKeyCursor % apiKeys.length;
  geminiKeyCursor = (geminiKeyCursor + 1) % Number.MAX_SAFE_INTEGER;

  return [...apiKeys.slice(startIndex), ...apiKeys.slice(0, startIndex)];
}

function shouldRetryWithNextKey(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /resource_exhausted|quota exceeded|code\":429|429|rate|unavailable|deadline|timed out|network|fetch failed|503|500|forbidden|permission|api key/i.test(
    message,
  );
}

function buildAiCacheKey(
  model: string,
  stock: StockLookupItem,
  technical: TechnicalSnapshot,
  signal: SignalSummary,
  companyContext?: CompanyContext | null,
) {
  return JSON.stringify({
    version: AI_CACHE_FORMAT_VERSION,
    model,
    symbol: stock.symbol,
    market: stock.market,
    technical,
    signal,
    companyContext: companyContext
      ? {
          instrumentLabel: companyContext.instrumentLabel,
          sector: companyContext.sector,
          group: companyContext.group,
          confidence: companyContext.confidence,
          cautionNote: companyContext.cautionNote,
        }
      : null,
  });
}

function getCachedSummary(cacheKey: string) {
  const cached = aiSummaryCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    aiSummaryCache.delete(cacheKey);
    return null;
  }

  return cached.summary;
}

function setCachedSummary(cacheKey: string, summary: AiSummary) {
  aiSummaryCache.set(cacheKey, {
    expiresAt: Date.now() + (summary.available ? AI_CACHE_SUCCESS_TTL_MS : AI_CACHE_FAILURE_TTL_MS),
    summary,
  });
}

async function generateAiSummaryInternal(
  stock: StockLookupItem,
  technical: TechnicalSnapshot,
  signal: SignalSummary,
  companyContext?: CompanyContext,
): Promise<AiSummary> {
  const apiKeys = getGeminiApiKeys();
  if (!apiKeys.length) {
    return {
      available: false,
      reason: "missing_api_key",
      disclaimer: AI_DISCLAIMER,
    };
  }

  const configuredModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const model = resolveGeminiModel(configuredModel);
  const resolvedCompanyContext = companyContext ?? (await resolveCompanyContext(stock));
  const prompt = buildPrompt(stock, technical, signal, resolvedCompanyContext);
  let lastError: unknown;

  try {
    for (const apiKey of getRotatedApiKeys(apiKeys)) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        for (const maxOutputTokens of AI_OUTPUT_TOKEN_BUDGETS) {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: 0.35,
              maxOutputTokens,
              thinkingConfig: {
                thinkingBudget: 0,
              },
              responseMimeType: "application/json",
              responseJsonSchema: AI_RESPONSE_JSON_SCHEMA,
            },
          });

          const text = response.text?.trim() ?? "";
          const finishReason = response.candidates?.[0]?.finishReason;

          try {
            const payload = parseAiResponsePayload(text);

            return {
              available: true,
              model,
              disclaimer: AI_DISCLAIMER,
              rawText: text,
              ...payload,
            };
          } catch (error) {
            lastError = error;

            const canRetryWithLargerBudget =
              finishReason === "MAX_TOKENS" &&
              maxOutputTokens !== AI_OUTPUT_TOKEN_BUDGETS[AI_OUTPUT_TOKEN_BUDGETS.length - 1];

            if (canRetryWithLargerBudget) {
              continue;
            }

            throw error;
          }
        }
      } catch (error) {
        lastError = error;

        if (!shouldRetryWithNextKey(error)) {
          throw error;
        }
      }
    }

    throw lastError;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini 호출 실패";

    return {
      available: false,
      reason: message,
      disclaimer: AI_DISCLAIMER,
    };
  }
}

export async function generateAiSummary(
  stock: StockLookupItem,
  technical: TechnicalSnapshot,
  signal: SignalSummary,
  companyContext?: CompanyContext,
): Promise<AiSummary> {
  const configuredModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const model = resolveGeminiModel(configuredModel);
  const cacheKey = buildAiCacheKey(model, stock, technical, signal, companyContext);
  const cached = getCachedSummary(cacheKey);
  if (cached) {
    return cached;
  }

  const inflight = aiSummaryInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = generateAiSummaryInternal(stock, technical, signal, companyContext)
    .then((summary) => {
      setCachedSummary(cacheKey, summary);
      return summary;
    })
    .finally(() => {
      aiSummaryInflight.delete(cacheKey);
    });

  aiSummaryInflight.set(cacheKey, request);
  return request;
}
