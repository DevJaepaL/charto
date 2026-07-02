"use client";

import { useEffect } from "react";

const adSenseClientId = (() => {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";

  if (!raw) {
    return "";
  }

  if (raw.startsWith("ca-pub-")) {
    return raw;
  }

  if (raw.startsWith("pub-")) {
    return `ca-${raw}`;
  }

  return `ca-pub-${raw}`;
})();

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  slot,
  label = "광고",
  className = "",
}: {
  slot?: string;
  label?: string;
  className?: string;
}) {
  const normalizedSlot = slot?.trim() ?? "";

  useEffect(() => {
    if (!adSenseClientId || !normalizedSlot) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore duplicate push/runtime hydration edge cases.
    }
  }, [normalizedSlot]);

  if (!adSenseClientId || !normalizedSlot) {
    return null;
  }

  return (
    <div className={`surface-card rounded-[12px] p-2.5 md:rounded-[12px] md:p-3 ${className}`.trim()}>
      <div className="mb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 md:text-[10px]">
        {label}
      </div>
      <ins
        className="adsbygoogle block min-h-[120px] overflow-hidden rounded-[12px] bg-[var(--surface-card-strong)] dark:bg-white/[0.04]"
        data-ad-client={adSenseClientId}
        data-ad-format="auto"
        data-ad-slot={normalizedSlot}
        data-full-width-responsive="true"
        style={{ display: "block" }}
      />
    </div>
  );
}
