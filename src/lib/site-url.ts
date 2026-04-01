const FALLBACK_SITE_URL = "https://www.charto.space";

function normalizeSiteUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeSiteUrl(process.env.SITE_URL) ||
    normalizeSiteUrl(process.env.NEXTAUTH_URL) ||
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    FALLBACK_SITE_URL
  );
}

export function getSiteUrlObject() {
  return new URL(getSiteUrl());
}
