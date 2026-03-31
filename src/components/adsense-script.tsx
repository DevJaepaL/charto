import Script from "next/script";

import { getAdSenseClientId } from "@/lib/adsense";

export function AdSenseScript() {
  const adSenseClientId = getAdSenseClientId();

  if (!adSenseClientId) {
    return null;
  }

  return (
    <Script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
      strategy="afterInteractive"
    />
  );
}
