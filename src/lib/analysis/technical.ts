import { inferCompanyContext, inferInstrumentProfile } from "@/lib/analysis/company-context";
import { clamp } from "@/lib/utils";
import type {
  Candle,
  CompanyContext,
  QuoteSnapshot,
  SignalSummary,
  StockLookupItem,
  TechnicalSnapshot,
} from "@/lib/types";

function lastOrNull(values: Array<number | null>) {
  return values.at(-1) ?? null;
}

function calculateSma(values: number[], period: number) {
  const result = Array<number | null>(values.length).fill(null);
  let sum = 0;

  for (let index = 0; index < values.length; index += 1) {
    sum += values[index];
    if (index >= period) {
      sum -= values[index - period];
    }

    if (index >= period - 1) {
      result[index] = sum / period;
    }
  }

  return result;
}

function calculateEma(values: number[], period: number) {
  const result = Array<number | null>(values.length).fill(null);
  const multiplier = 2 / (period + 1);
  let previous: number | null = null;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    previous = previous === null ? value : (value - previous) * multiplier + previous;

    if (index >= period - 1) {
      result[index] = previous;
    }
  }

  return result;
}

function calculateRsi(values: number[], period: number) {
  const result = Array<number | null>(values.length).fill(null);

  if (values.length < period + 1) {
    return result;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const diff = values[index] - values[index - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses += Math.abs(diff);
    }
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;
  result[period] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);

  for (let index = period + 1; index < values.length; index += 1) {
    const diff = values[index] - values[index - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    result[index] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
  }

  return result;
}

function calculateMacd(values: number[]) {
  const ema12 = calculateEma(values, 12);
  const ema26 = calculateEma(values, 26);
  const macdLine = values.map((_, index) => {
    if (ema12[index] === null || ema26[index] === null) {
      return null;
    }

    return (ema12[index] ?? 0) - (ema26[index] ?? 0);
  });

  const signalLine = calculateEma(macdLine.map((value) => value ?? 0), 9);
  const histogram = macdLine.map((value, index) => {
    if (value === null || signalLine[index] === null) {
      return null;
    }

    return value - (signalLine[index] ?? 0);
  });

  return { macdLine, signalLine, histogram };
}

function calculateBollinger(values: number[], period: number, multiplier: number) {
  const sma = calculateSma(values, period);
  const upper = Array<number | null>(values.length).fill(null);
  const lower = Array<number | null>(values.length).fill(null);

  for (let index = period - 1; index < values.length; index += 1) {
    const average = sma[index];
    if (average === null) {
      continue;
    }

    const slice = values.slice(index - period + 1, index + 1);
    const variance =
      slice.reduce((total, value) => total + (value - average) ** 2, 0) / period;
    const deviation = Math.sqrt(variance);

    upper[index] = average + deviation * multiplier;
    lower[index] = average - deviation * multiplier;
  }

  return {
    upper,
    middle: sma,
    lower,
  };
}

function resolveVolumeStatus(currentVolume: number, averageVolume: number | null) {
  if (!averageVolume || averageVolume === 0) {
    return "보합";
  }

  const ratio = currentVolume / averageVolume;
  if (ratio >= 1.6) {
    return "거래량 급증";
  }

  if (ratio <= 0.7) {
    return "거래량 둔화";
  }

  return "보통";
}

function roundMetric(value: number | null) {
  return value === null ? null : Number(value.toFixed(2));
}

function getAverageAbsoluteReturn(candles: Candle[], period: number) {
  const slice = candles.slice(-(period + 1));
  if (slice.length < 2) {
    return 0;
  }

  let total = 0;
  let count = 0;

  for (let index = 1; index < slice.length; index += 1) {
    const previousClose = slice[index - 1].close;
    if (!previousClose) {
      continue;
    }

    total += Math.abs(((slice[index].close - previousClose) / previousClose) * 100);
    count += 1;
  }

  return count ? total / count : 0;
}

function getAverageIntradayRange(candles: Candle[], period: number) {
  const slice = candles.slice(-period);
  if (!slice.length) {
    return 0;
  }

  const total = slice.reduce((sum, candle) => {
    if (!candle.close) {
      return sum;
    }

    return sum + ((candle.high - candle.low) / candle.close) * 100;
  }, 0);

  return total / slice.length;
}

function pullScoreTowardNeutral(score: number, penalty: number) {
  if (score > 0) {
    return Math.max(0, score - penalty);
  }

  if (score < 0) {
    return Math.min(0, score + penalty);
  }

  return 0;
}

function buildTechnicalSnapshot(candles: Candle[], quote: QuoteSnapshot) {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const sma5 = calculateSma(closes, 5);
  const sma20 = calculateSma(closes, 20);
  const sma60 = calculateSma(closes, 60);
  const ema20 = calculateEma(closes, 20);
  const rsi14 = calculateRsi(closes, 14);
  const macd = calculateMacd(closes);
  const bollinger = calculateBollinger(closes, 20, 2);
  const volumeAverage20 = calculateSma(volumes, 20);
  const latestClose = closes.at(-1) ?? 0;
  const recentCandles = candles.slice(-20);
  const support = recentCandles.length
    ? Math.min(...recentCandles.map((candle) => candle.low))
    : null;
  const resistance = recentCandles.length
    ? Math.max(...recentCandles.map((candle) => candle.high))
    : null;
  const bollUpper = lastOrNull(bollinger.upper);
  const bollLower = lastOrNull(bollinger.lower);
  const bollMiddle = lastOrNull(bollinger.middle);
  const bollingerPosition =
    bollUpper !== null && bollLower !== null && bollUpper !== bollLower
      ? (latestClose - bollLower) / (bollUpper - bollLower)
      : null;

  return {
    closes,
    latestClose,
    snapshot: {
    currentPrice: quote.currentPrice,
    change: quote.change,
    changePercent: quote.changePercent,
    sma5: roundMetric(lastOrNull(sma5)),
    sma20: roundMetric(lastOrNull(sma20)),
    sma60: roundMetric(lastOrNull(sma60)),
    ema20: roundMetric(lastOrNull(ema20)),
    rsi14: roundMetric(lastOrNull(rsi14)),
    macd: roundMetric(lastOrNull(macd.macdLine)),
    macdSignal: roundMetric(lastOrNull(macd.signalLine)),
    macdHistogram: roundMetric(lastOrNull(macd.histogram)),
    bollingerUpper: roundMetric(bollUpper),
    bollingerMiddle: roundMetric(bollMiddle),
    bollingerLower: roundMetric(bollLower),
    bollingerPosition: bollingerPosition === null ? null : Number(bollingerPosition.toFixed(2)),
    volumeAverage20: roundMetric(lastOrNull(volumeAverage20)),
    volumeStatus: resolveVolumeStatus(volumes.at(-1) ?? 0, lastOrNull(volumeAverage20)),
    support: support === null ? null : Math.round(support),
    resistance: resistance === null ? null : Math.round(resistance),
    } satisfies TechnicalSnapshot,
  };
}

function buildSignalSummary(snapshot: TechnicalSnapshot, latestClose: number) {
  const reasons: string[] = [];
  const risks: string[] = [];
  let score = 0;

  if (snapshot.sma20 !== null) {
    if (latestClose > snapshot.sma20) {
      score += 18;
      reasons.push("현재가가 20일선 위에 있습니다. 단기 추세가 강합니다.");
    } else {
      score -= 18;
      reasons.push("현재가가 20일선 아래에 있습니다. 단기 추세는 아직 약합니다.");
    }
  }

  if (snapshot.sma5 !== null && snapshot.sma20 !== null) {
    if (snapshot.sma5 > snapshot.sma20) {
      score += 16;
      reasons.push("5일선이 20일선 위에 있습니다. 최근 매수 흐름이 우위입니다.");
    } else {
      score -= 16;
      reasons.push("5일선이 20일선 아래에 있습니다. 최근 매수 흐름은 아직 약합니다.");
    }
  }

  if (snapshot.rsi14 !== null) {
    if (snapshot.rsi14 >= 55 && snapshot.rsi14 <= 68) {
      score += 14;
      reasons.push("RSI가 55~68 구간에 있습니다. 모멘텀이 유지되고 있습니다.");
    } else if (snapshot.rsi14 <= 35) {
      score -= 10;
      risks.push("RSI가 약세권에 머물러 있습니다. 반등 확인 전까지 변동성에 주의가 필요합니다.");
    } else if (snapshot.rsi14 >= 72) {
      score -= 8;
      risks.push("RSI가 과열권에 가깝습니다. 단기 눌림 가능성을 점검해야 합니다.");
    }
  }

  if (snapshot.macdHistogram !== null) {
    if (snapshot.macdHistogram > 0) {
      score += 16;
      reasons.push("MACD 히스토그램이 플러스입니다. 상승 탄력이 이어지고 있습니다.");
    } else {
      score -= 16;
      reasons.push("MACD 히스토그램이 마이너스입니다. 단기 모멘텀이 둔화된 상태입니다.");
    }
  }

  if (snapshot.volumeStatus === "거래량 급증") {
    if (snapshot.changePercent >= 0) {
      score += 12;
      reasons.push("거래량이 급증하며 상승이 동반됐습니다. 추세 신뢰도가 높습니다.");
    } else {
      score -= 12;
      risks.push("거래량 급증이 하락과 함께 나왔습니다. 단기 매물 압력이 강한 편입니다.");
    }
  }

  if (snapshot.bollingerPosition !== null) {
    if (snapshot.bollingerPosition >= 0.7) {
      score += 8;
      reasons.push("볼린저 상단권에 위치합니다. 강한 추세 구간으로 볼 수 있습니다.");
    } else if (snapshot.bollingerPosition <= 0.25) {
      score -= 8;
      risks.push("볼린저 하단권에 가깝습니다. 반등 전까지 약세 압력이 남아 있습니다.");
    }
  }

  if (
    snapshot.support !== null &&
    snapshot.currentPrice < snapshot.support * 1.01 &&
    snapshot.currentPrice > snapshot.support * 0.99
  ) {
    reasons.push("최근 지지선 부근에서 버티고 있습니다. 반등 시도 구간으로 볼 수 있습니다.");
  }

  if (
    snapshot.resistance !== null &&
    snapshot.currentPrice > snapshot.resistance * 0.98 &&
    snapshot.currentPrice < snapshot.resistance * 1.02
  ) {
    risks.push("최근 저항선 근처입니다. 돌파 실패 시 단기 되돌림이 나올 수 있습니다.");
  }

  score = clamp(score, -100, 100);
  const bias: SignalSummary["bias"] =
    score >= 18 ? "bullish" : score <= -18 ? "bearish" : "neutral";

  return {
    bias,
    score,
    reasons,
    risks,
    support: snapshot.support,
    resistance: snapshot.resistance,
  } satisfies SignalSummary;
}

function applySignalGuardrails(
  signal: SignalSummary,
  snapshot: TechnicalSnapshot,
  candles: Candle[],
  stock: StockLookupItem,
  companyContext = inferCompanyContext(stock),
) {
  const profile = inferInstrumentProfile(stock);
  const risks = [...signal.risks];
  let score = signal.score;

  if (profile.isExchangeTradedProduct) {
    score = pullScoreTowardNeutral(score, profile.isDirectionalProduct ? 40 : 28);
    risks.unshift(
      profile.kind === "etn"
        ? "ETN은 개별 기업 실적보다 기초자산과 상품 구조 영향이 커 추천 점수를 보수적으로 반영합니다."
        : "ETF는 개별 기업 분석보다 기초지수와 상품 구조 영향이 커 추천 점수를 보수적으로 반영합니다.",
    );
  }

  if (companyContext.interpretWithCaution && !profile.isExchangeTradedProduct) {
    score = pullScoreTowardNeutral(score, companyContext.confidence === "high" ? 10 : 18);
    if (companyContext.cautionNote) {
      risks.unshift(companyContext.cautionNote);
    }
  }

  if (companyContext.confidence === "low") {
    score = pullScoreTowardNeutral(score, 12);
    risks.unshift("업종 분류 신뢰도가 낮아 기술적 점수는 참고용으로만 보는 편이 좋습니다.");
  }

  const averageAbsoluteReturn = getAverageAbsoluteReturn(candles, 10);
  const averageIntradayRange = getAverageIntradayRange(candles, 5);
  const latestMove = Math.abs(snapshot.changePercent);

  if (averageAbsoluteReturn >= 6 || averageIntradayRange >= 12 || latestMove >= 18) {
    score = pullScoreTowardNeutral(score, 36);
    risks.unshift("최근 급등락이 큰 종목이라 기술적 점수는 한 단계 보수적으로 해석합니다.");
  } else if (averageAbsoluteReturn >= 3.5 || averageIntradayRange >= 7 || latestMove >= 10) {
    score = pullScoreTowardNeutral(score, 18);
    risks.unshift("최근 변동성이 큰 편이라 추격 매수·매도 판단은 보수적으로 보는 편이 좋습니다.");
  }

  score = clamp(score, -100, 100);
  const bias: SignalSummary["bias"] =
    score >= 18 ? "bullish" : score <= -18 ? "bearish" : "neutral";

  return {
    ...signal,
    score,
    bias,
    risks: [...new Set(risks)],
  } satisfies SignalSummary;
}

function buildPreviousQuote(candles: Candle[]): QuoteSnapshot | null {
  const latest = candles.at(-1);
  if (!latest) {
    return null;
  }

  const previousClose = candles.at(-2)?.close ?? latest.open;
  const change = latest.close - previousClose;

  return {
    currentPrice: latest.close,
    previousClose,
    change,
    changePercent: previousClose === 0 ? 0 : (change / previousClose) * 100,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
  };
}

export function buildTechnicalAnalysis(
  candles: Candle[],
  quote: QuoteSnapshot,
  stock: StockLookupItem,
  companyContext?: CompanyContext,
) {
  const current = buildTechnicalSnapshot(candles, quote);
  const resolvedContext = companyContext ?? inferCompanyContext(stock);
  const signal = applySignalGuardrails(
    buildSignalSummary(current.snapshot, current.latestClose),
    current.snapshot,
    candles,
    stock,
    resolvedContext,
  );
  const previousCandles = candles.slice(0, -1);
  const previousQuote = buildPreviousQuote(previousCandles);

  let previousScore: number | null = null;
  if (previousCandles.length >= 2 && previousQuote) {
    const previous = buildTechnicalSnapshot(previousCandles, previousQuote);
    previousScore = applySignalGuardrails(
      buildSignalSummary(previous.snapshot, previousQuote.currentPrice),
      previous.snapshot,
      previousCandles,
      stock,
      resolvedContext,
    ).score;
  }

  return {
    technical: current.snapshot,
    signal: {
      ...signal,
      previousScore,
      scoreDelta: previousScore === null ? null : signal.score - previousScore,
    } satisfies SignalSummary,
  };
}
