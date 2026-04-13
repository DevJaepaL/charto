import { permanentRedirect } from "next/navigation";

export default function MarketOverviewRedirectPage() {
  permanentRedirect("/guide#market");
}
