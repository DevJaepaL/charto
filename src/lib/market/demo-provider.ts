import type { Candle, CandleInterval, CandleRange, QuoteSnapshot } from "@/lib/types";
import {
  candleLabelFromTimestamp,
  getDailyCandleCount,
  getIntradayDayCount,
  makeKstTimestamp,
  resampleCandles,
  resampleWeeklyCandles,
} from "@/lib/market/shared";
import type { MarketDataProvider, ProviderCandlePayload } from "@/lib/market/provider";

function seedFromSymbol(symbol: string) {
  return symbol
    .split("")
    .reduce((total, value, index) => total * 31 + value.charCodeAt(0) * (index + 1), 17);
}

function buildTradingDates(count: number) {
  const dates: Date[] = [];
  const cursor = new Date();

  while (dates.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return dates.reverse();
}

function buildDailyCandles(symbol: string, range: CandleRange) {
  const count = Math.max(getDailyCandleCount(range), 90);
  const dates = buildTradingDates(count);
  const seed = seedFromSymbol(symbol);
  let price = 50000 + (seed % 150000);

  return dates.map((date, index) => {
    const wave = Math.sin((index + seed) / 6) * 0.02;
    const trend = (index - dates.length / 2) * 0.0014;
    const drift = 1 + wave + trend / dates.length;
    const open = price * (1 + Math.sin((index + seed) / 11) * 0.008);
    const close = Math.max(1000, open * drift);
    const high = Math.max(open, close) * 1.012;
    const low = Math.min(open, close) * 0.988;
    const volume = Math.round(
      (seed % 700000) + 700000 + index * 1200 + Math.cos(index / 5) * 100000,
    );
    price = close;

    const time = makeKstTimestamp(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      15,
      30,
    );

    return {
      time,
      label: candleLabelFromTimestamp(time, false),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    };
  });
}

function buildMinuteCandles(symbol: string, range: CandleRange) {
  const tradingDays = getIntradayDayCount(range);
  const dates = buildTradingDates(tradingDays);
  const seed = seedFromSymbol(symbol);
  let price = 50000 + (seed % 120000);
  const candles: Candle[] = [];

  for (const [dayIndex, date] of dates.entries()) {
    for (let minute = 0; minute <= 390; minute += 1) {
      const baseMinute = 9 * 60 + minute;
      const hour = Math.floor(baseMinute / 60);
      const minuteOfHour = baseMinute % 60;
      if (hour > 15 || (hour === 15 && minuteOfHour > 30)) {
        continue;
      }

      const drift = Math.sin((dayIndex * 390 + minute + seed) / 27) * 0.002;
      const jitter = Math.cos((minute + seed) / 19) * 0.0014;
      const open = price;
      const close = Math.max(1000, open * (1 + drift + jitter));
      const high = Math.max(open, close) * 1.0025;
      const low = Math.min(open, close) * 0.9975;
      const volume = Math.round(
        1000 + ((seed + minute * 17) % 9000) + Math.abs(Math.sin(minute / 13)) * 15000,
      );
      price = close;

      const time = makeKstTimestamp(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        minuteOfHour,
      );

      candles.push({
        time,
        label: candleLabelFromTimestamp(time, true),
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
        volume,
      });
    }
  }

  return candles;
}

function quoteFromCandles(candles: Candle[]): QuoteSnapshot {
  const latest = candles.at(-1) ?? candles[0];
  const previous = candles.at(-2) ?? latest;

  return {
    currentPrice: latest.close,
    previousClose: previous.close,
    change: latest.close - previous.close,
    changePercent:
      previous.close === 0 ? 0 : ((latest.close - previous.close) / previous.close) * 100,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
  };
}

export class DemoMarketDataProvider implements MarketDataProvider {
  providerId = "demo" as const;

  async getCandles(
    symbol: string,
    interval: CandleInterval,
    range: CandleRange,
  ): Promise<ProviderCandlePayload> {
    if (interval === "1d" || interval === "1w") {
      const dailyCandles = buildDailyCandles(symbol, range);
      const candles = interval === "1w" ? resampleWeeklyCandles(dailyCandles) : dailyCandles;
      const visible = candles.slice(-getDailyCandleCount(range));

      return {
        provider: this.providerId,
        isDemo: true,
        notice: "데모 데이터 모드입니다. 실제 시세를 보려면 한국투자 Open API 키를 설정하세요.",
        candles: visible,
        quote: quoteFromCandles(visible),
      };
    }

    const minuteCandles = buildMinuteCandles(symbol, range);
    const intervalMinutes = Number.parseInt(interval, 10);
    const candles = resampleCandles(minuteCandles, intervalMinutes);

    return {
      provider: this.providerId,
      isDemo: true,
      notice: "데모 데이터 모드입니다. 분봉은 예시 데이터로 생성됩니다.",
      candles,
      quote: quoteFromCandles(candles),
    };
  }
}
