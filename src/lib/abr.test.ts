import { describe, expect, it } from "vitest";
import {
  getAbrDeckUrls,
  matchAbrTournamentCandidates,
  type AbrEntry,
  type AbrTournament,
} from "./abr";

const tournaments: AbrTournament[] = [
  {
    id: 5249,
    title: "Megacity Hasselt (Belgium)",
    date: "2026.07.04.",
    end_date: "2026.07.05.",
    location: "Belgium, Hasselt",
    players_count: 33,
    top_count: 8,
    url: "https://alwaysberunning.net/tournaments/5249/megacity-hasselt-belgium",
  },
  {
    id: 5739,
    title: "Startup side event Megacity Hasselt",
    date: "2026.07.05.",
    location: "Belgium, Hasselt",
    players_count: 8,
    top_count: 0,
    url: "https://alwaysberunning.net/tournaments/5739/startup-side-event-megacity-hasselt",
  },
];

describe("matchAbrTournamentCandidates", () => {
  it("matches a multi-day event by source date and location", () => {
    const result = matchAbrTournamentCandidates(
      {
        name: "Hasselt Megacity",
        date: "2026-07-04",
        city: "Hasselt",
        country: "Belgium",
        playerCount: 33,
        cutSize: 8,
      },
      tournaments
    );

    expect(result.status).toBe("matched");
    expect(result.tournament?.id).toBe(5249);
  });

  it("does not select between indistinguishable candidates", () => {
    const duplicate = { ...tournaments[0], id: 6000 };
    const result = matchAbrTournamentCandidates(
      {
        name: "Hasselt Megacity",
        date: "2026-07-04",
        city: "Hasselt",
        country: "Belgium",
        playerCount: 33,
        cutSize: 8,
      },
      [tournaments[0], duplicate]
    );

    expect(result.status).toBe("ambiguous");
    expect(result.tournament).toBeNull();
  });

  it("does not match on date and location alone", () => {
    const result = matchAbrTournamentCandidates(
      {
        name: "Different tournament",
        date: "2026-07-04",
        city: "Hasselt",
        country: "Belgium",
      },
      [tournaments[0]]
    );

    expect(result.status).toBe("unmatched");
  });
});

describe("getAbrDeckUrls", () => {
  it("keeps Corp and Runner URLs on their respective sides", () => {
    const entry = {
      corp_deck_url: "https://netrunnerdb.com/en/decklist/corp-list",
      runner_deck_url: "https://netrunnerdb.com/en/decklist/runner-list",
    } as AbrEntry;

    expect(getAbrDeckUrls(entry)).toEqual({
      corp: "https://netrunnerdb.com/en/decklist/corp-list",
      runner: "https://netrunnerdb.com/en/decklist/runner-list",
    });
  });
});
