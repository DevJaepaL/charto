"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { isPathEligibleForAds } from "@/lib/ad-policy";

const ADSENSE_SCRIPT_ID = "charto-adsense-script";

export function AdSenseClientScript({ clientId }: { clientId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!clientId || !isPathEligibleForAds(pathname)) {
      return;
    }

    if (document.getElementById(ADSENSE_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    document.head.appendChild(script);
  }, [clientId, pathname]);

  return null;
}
