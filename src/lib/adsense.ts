function normalizePublisherId(value: string | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("ca-pub-")) {
    return trimmed;
  }

  if (trimmed.startsWith("pub-")) {
    return `ca-${trimmed}`;
  }

  return `ca-pub-${trimmed}`;
}

export function getAdSenseClientId() {
  return normalizePublisherId(
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? process.env.ADSENSE_PUBLISHER_ID,
  );
}

export function getAdSensePublisherId() {
  return getAdSenseClientId().replace(/^ca-/, "");
}

export function isAdSenseEnabled() {
  return Boolean(getAdSenseClientId());
}
