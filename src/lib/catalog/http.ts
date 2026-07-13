type CachedExternalResponse = {
  body: string;
  etag: string | null;
  lastModified: string | null;
};

type ExternalResponseCache = Map<string, CachedExternalResponse>;

const globalForExternalResponses = globalThis as typeof globalThis & {
  makersEyeExternalResponses?: ExternalResponseCache;
};

const responseCache =
  globalForExternalResponses.makersEyeExternalResponses ?? new Map();
globalForExternalResponses.makersEyeExternalResponses = responseCache;

export type ExternalTextResponse = {
  body: string;
  ok: boolean;
  status: number;
  reused: boolean;
};

export async function fetchTextWithValidators(
  url: string,
  init: RequestInit = {}
): Promise<ExternalTextResponse> {
  const cached = responseCache.get(url);
  const headers = new Headers(init.headers);
  if (cached?.etag) headers.set("If-None-Match", cached.etag);
  if (cached?.lastModified) {
    headers.set("If-Modified-Since", cached.lastModified);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (response.status === 304 && cached) {
    return { body: cached.body, ok: true, status: 200, reused: true };
  }

  const body = await response.text();
  const etag = response.headers.get("etag");
  const lastModified = response.headers.get("last-modified");
  if (response.ok && (etag || lastModified)) {
    responseCache.set(url, { body, etag, lastModified });
  }
  return {
    body,
    ok: response.ok,
    status: response.status,
    reused: false,
  };
}

export async function fetchJsonWithValidators<T>(
  url: string,
  init: RequestInit = {}
): Promise<{ data: T; reused: boolean }> {
  const response = await fetchTextWithValidators(url, init);
  if (!response.ok) throw new Error(`Source returned ${response.status}.`);
  return { data: JSON.parse(response.body) as T, reused: response.reused };
}
