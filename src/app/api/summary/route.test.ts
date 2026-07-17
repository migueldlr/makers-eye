import { beforeEach, describe, expect, it, vi } from "vitest";

const getLatestBanlistWins = vi.fn();

vi.mock("@/lib/latestBanlistWins", () => ({
  getLatestBanlistWins,
}));

import { GET } from "./route";

describe("GET /api/summary", () => {
  beforeEach(() => {
    getLatestBanlistWins.mockReset();
  });

  it("returns only the Runner and Corp win totals", async () => {
    getLatestBanlistWins.mockResolvedValue({
      runnerWins: 42,
      corpWins: 39,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      runnerWins: 42,
      corpWins: 39,
    });
  });
});
