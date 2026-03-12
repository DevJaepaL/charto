import type { Candle, CandleRange } from "@/lib/types";

export function getKstDateParts(timestamp: number) {
  const shifted = new Date((timestamp + 9 * 60 * 60) * 1000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

export function makeKstTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
) {
  return Math.floor(Date.UTC(year, month, day, hour, minute, second) / 1000) - 9 * 60 * 60;
}

export function candleLabelFromTimestamp(timestamp: number, intraday: boolean) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    ...(intraday
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(timestamp * 1000);
}

export function resampleCandles(candles: Candle[], intervalMinutes: number) {
  const bucketed = new Map<number, Candle[]>();

  for (const candle of candles) {
    const parts = getKstDateParts(candle.time);
    const minutesFromMidnight = parts.hour * 60 + parts.minute;
    const bucketStart = Math.floor(minutesFromMidnight / intervalMinutes) * intervalMinutes;
    const bucketHour = Math.floor(bucketStart / 60);
    const bucketMinute = bucketStart % 60;
    const bucketTimestamp = makeKstTimestamp(
      parts.year,
      parts.month,
      parts.day,
      bucketHour,
      bucketMinute,
    );

    const existing = bucketed.get(bucketTimestamp) ?? [];
    existing.push(candle);
    bucketed.set(bucketTimestamp, existing);
  }

  return [...bucketed.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([bucketTimestamp, entries]) => {
      const first = entries[0];
      const last = entries.at(-1) ?? first;

      return {
        time: bucketTimestamp,
        label: candleLabelFromTimestamp(bucketTimestamp, true),
        open: first.open,
        high: Math.max(...entries.map((entry) => entry.high)),
        low: Math.min(...entries.map((entry) => entry.low)),
        close: last.close,
        volume: entries.reduce((total, entry) => total + entry.volume, 0),
      };
    });
}

export function resampleWeeklyCandles(candles: Candle[]) {
  const bucketed = new Map<string, Candle[]>();

  for (const candle of candles) {
    const parts = getKstDateParts(candle.time);
    const currentDate = new Date(Date.UTC(parts.year, parts.month, parts.day));
    const day = currentDate.getUTCDay() || 7;
    currentDate.setUTCDate(currentDate.getUTCDate() - day + 1);

    const key = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth()}-${currentDate.getUTCDate()}`;
    const entries = bucketed.get(key) ?? [];
    entries.push(candle);
    bucketed.set(key, entries);
  }

  return [...bucketed.entries()]
    .map(([key, entries]) => {
      const [year, month, day] = key.split("-").map(Number);
      const time = makeKstTimestamp(year, month, day, 15, 30);
      const first = entries[0];
      const last = entries.at(-1) ?? first;

      return {
        time,
        label: candleLabelFromTimestamp(time, false),
        open: first.open,
        high: Math.max(...entries.map((entry) => entry.high)),
        low: Math.min(...entries.map((entry) => entry.low)),
        close: last.close,
        volume: entries.reduce((total, entry) => total + entry.volume, 0),
      };
    })
    .sort((left, right) => left.time - right.time);
}

export function getDailyCandleCount(range: CandleRange) {
  switch (range) {
    case "1d":
      return 1;
    case "1w":
      return 5;
    case "1mo":
      return 24;
    case "3mo":
      return 72;
    case "6mo":
      return 140;
    case "1y":
      return 280;
    case "3y":
      return 760;
    case "5y":
      return 1260;
    case "max":
      return 5000;
  }
}

export function getIntradayDayCount(range: CandleRange) {
  switch (range) {
    case "1d":
      return 1;
    case "1w":
      return 5;
    case "1mo":
      return 20;
    case "3mo":
      return 20;
    case "6mo":
      return 20;
    case "1y":
      return 20;
    case "3y":
      return 20;
    case "5y":
      return 20;
    case "max":
      return 20;
  }
}
