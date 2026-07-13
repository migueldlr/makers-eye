import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTextWithValidators } from "./http";

describe("fetchTextWithValidators", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reuses a cached body after an ETag 304 response", async () => {
    const url = "https://example.com/etag-test.json";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('{"ok":true}', {
          status: 200,
          headers: { etag: 'W/"test"' },
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    vi.stubGlobal("fetch", fetchMock);

    expect((await fetchTextWithValidators(url)).reused).toBe(false);
    const second = await fetchTextWithValidators(url);

    expect(second).toMatchObject({
      body: '{"ok":true}',
      ok: true,
      reused: true,
      status: 200,
    });
    const headers = new Headers(fetchMock.mock.calls[1][1]?.headers);
    expect(headers.get("If-None-Match")).toBe('W/"test"');
  });
});
