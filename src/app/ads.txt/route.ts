import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const publisherId = (process.env.ADSENSE_PUBLISHER_ID ?? "").trim().replace(/^pub-/, "");
  const content = publisherId
    ? `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# Set ADSENSE_PUBLISHER_ID to expose a valid ads.txt record.\n";

  return new NextResponse(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
