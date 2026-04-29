import { AdSenseClientScript } from "@/components/adsense-client-script";
import { getAdSenseClientId } from "@/lib/adsense";

export function AdSenseScript() {
  const adSenseClientId = getAdSenseClientId();

  if (!adSenseClientId) {
    return null;
  }

  return <AdSenseClientScript clientId={adSenseClientId} />;
}
