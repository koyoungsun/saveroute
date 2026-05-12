export function getBrandFaviconUrl(
  officialUrl: string | null | undefined,
  size = 64,
) {
  if (!officialUrl) {
    return null;
  }

  const trimmedUrl = officialUrl.trim();
  if (!trimmedUrl) {
    return null;
  }

  try {
    const url = new URL(trimmedUrl);
    return buildGoogleFaviconUrl(url.hostname, size);
  } catch {
    try {
      const url = new URL(`https://${trimmedUrl}`);
      return buildGoogleFaviconUrl(url.hostname, size);
    } catch {
      return null;
    }
  }
}

function buildGoogleFaviconUrl(hostname: string, size: number) {
  const domain = hostname.replace(/^www\./, "");
  if (!domain) {
    return null;
  }

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
