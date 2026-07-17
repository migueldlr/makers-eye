import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLatestBanlistWins } = vi.hoisted(() => ({
  getLatestBanlistWins: vi.fn(),
}));

vi.mock("@/lib/latestBanlistWins", () => ({
  getLatestBanlistWins,
}));

import { GET } from "./route";

describe("GET /api/summary", () => {
  beforeEach(() => {
    getLatestBanlistWins.mockReset();
  });

  it("returns the Runner wins, Corp wins, and draws", async () => {
    getLatestBanlistWins.mockResolvedValue({
      runnerWins: 42,
      corpWins: 39,
      draws: 7,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      runnerWins: 42,
      corpWins: 39,
      draws: 7,
    });
  });
});
