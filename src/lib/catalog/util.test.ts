import { describe, expect, it } from "vitest";
import {
  canonicalDeck,
  catalogEventMatchesSearch,
  compareDecks,
  extractAbrTournamentId,
  extractNrdbDeckId,
  formatCatalogDate,
  normalizeCatalogText,
  validateExternalUrl,
} from "./util";
import type { CatalogEventSummary } from "./types";

const event: CatalogEventSummary = {
  id: 1,
  name: "Méliès Megacity Championship",
  date: "2026-07-04",
  displayDate: "July 4, 2026",
  location: "Montréal",
  region: "Americas",
  format: "standard",
  cardpool: "Standard",
  cobraUrl: "https://tournaments.nullsignal.games/tournaments/1",
  abrUrl: null,
  cutSize: 8,
  deckCount: 16,
  playerNames: ["René", "Matuszczak"],
  entrants: [
    {
      name: "René",
      swissRank: 1,
      topCutRank: 2,
      corpIdentity: "Corp",
      runnerIdentity: "Runner",
      decks: {},
    },
    {
      name: "Matuszczak",
      swissRank: 2,
      topCutRank: 4,
      corpIdentity: "Corp",
      runnerIdentity: "Runner",
      decks: {},
    },
  ],
};

describe("catalog text and search", () => {
  it("normalizes case, diacritics, quotes, and whitespace", () => {
    expect(normalizeCatalogText("  “MÉLIÈS”   René  ")).toBe("melies rene");
  });

  it.each(["melies", "RENE", "2026-07-04", "July 4", "matusz"])(
    "matches %s in the client-side event index",
    (query) => {
      expect(catalogEventMatchesSearch(event, query)).toBe(true);
    }
  );

  it("formats stored dates without a timezone shift", () => {
    expect(formatCatalogDate("2026-07-04")).toBe("July 4, 2026");
  });
});

describe("deck comparison", () => {
  it("ignores card order but detects quantity changes", () => {
    const cobra = [
      { title: "Hedge Fund", quantity: 3 },
      { title: "Spin Doctor", quantity: 2 },
    ];
    const reordered = [
      { title: "Spin Doctor", quantity: 2 },
      { title: "Hedge Fund", quantity: 3 },
    ];
    expect(canonicalDeck(cobra)).toBe(canonicalDeck(reordered));
    expect(compareDecks(cobra, reordered)).toBe("identical");
    expect(
      compareDecks(cobra, [
        { title: "Spin Doctor", quantity: 1 },
        { title: "Hedge Fund", quantity: 3 },
      ])
    ).toBe("mismatch");
  });

  it("uses shared printing IDs when display titles differ", () => {
    expect(
      compareDecks(
        [{ id: "30030", title: "Sure Gamble", quantity: 3 }],
        [{ id: "30030", title: "Localized title", quantity: 3 }]
      )
    ).toBe("identical");
  });
});

describe("external links", () => {
  it("extracts ABR and both numeric and UUID NRDB IDs", () => {
    expect(
      extractAbrTournamentId(
        "https://alwaysberunning.net/tournaments/5474/sansan-north"
      )
    ).toBe("5474");
    expect(
      extractNrdbDeckId("https://netrunnerdb.com/en/decklist/88740/example")
    ).toBe("88740");
    expect(
      extractNrdbDeckId(
        "https://netrunnerdb.com/en/decklist/ef733e9a-d391-43bb-9832-21ddc06ad516/example"
      )
    ).toBe("ef733e9a-d391-43bb-9832-21ddc06ad516");
  });

  it("rejects links outside the allowed host", () => {
    expect(() =>
      validateExternalUrl("https://example.com/decklist/1", ["netrunnerdb.com"])
    ).toThrow(/must use https/);
  });
});
