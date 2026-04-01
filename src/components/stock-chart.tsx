"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type HistogramData,
  type UTCTimestamp,
} from "lightweight-charts";

import type { Candle } from "@/lib/types";

interface StockChartProps {
  candles: Candle[];
}

function getDefaultVisibleBars(totalBars: number, isMobile: boolean) {
  if (totalBars <= 14) {
    return totalBars;
  }

  if (totalBars <= 32) {
    return isMobile ? Math.max(12, totalBars - 4) : Math.max(14, totalBars - 2);
  }

  if (totalBars <= 80) {
    return isMobile ? 22 : 30;
  }

  if (totalBars <= 180) {
    return isMobile ? 36 : 52;
  }

  if (totalBars <= 360) {
    return isMobile ? 48 : 68;
  }

  return isMobile ? 64 : 84;
}

function getDefaultVisibleLogicalRange(totalBars: number, isMobile: boolean) {
  const visibleBars = getDefaultVisibleBars(totalBars, isMobile);
  const leftPadding = isMobile ? 0.35 : 0.6;
  const rightOffset = isMobile ? 0.65 : 1.1;

  return {
    from: Math.max(-0.5, totalBars - visibleBars - leftPadding),
    to: totalBars - 1 + rightOffset,
  };
}

export function StockChart({ candles }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) {
      return;
    }

    const isMobile = window.innerWidth < 640;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        attributionLogo: false,
      },
      localization: {
        priceFormatter: (price: number) => new Intl.NumberFormat("ko-KR").format(Math.round(price)),
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        minimumWidth: isMobile ? 54 : 68,
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        timeVisible: true,
        minimumHeight: isMobile ? 28 : 34,
      },
      crosshair: {
        vertLine: {
          color: "rgba(36, 87, 135, 0.22)",
          labelBackgroundColor: "#245787",
        },
        horzLine: {
          color: "rgba(36, 87, 135, 0.22)",
          labelBackgroundColor: "#245787",
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#f04251",
      downColor: "#3485fa",
      borderVisible: false,
      wickUpColor: "#f04251",
      wickDownColor: "#3485fa",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    candleSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.08,
        bottom: 0.26,
      },
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
    });

    candleSeries.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );

    volumeSeries.setData(
      candles.map<HistogramData<UTCTimestamp>>((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume,
        color: candle.close >= candle.open ? "rgba(240, 66, 81, 0.35)" : "rgba(52, 133, 250, 0.35)",
      })),
    );

    chart.timeScale().setVisibleLogicalRange(
      getDefaultVisibleLogicalRange(candles.length, isMobile),
    );

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        height: containerRef.current?.clientHeight ?? 320,
      });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles]);

  return <div className="h-[250px] w-full max-w-full overflow-hidden sm:h-[340px] lg:h-[420px]" ref={containerRef} />;
}
