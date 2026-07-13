import { describe, expect, it } from "vitest";
import {
  canonicalDeck,
  catalogEventMatchesSearch,
  compareDecks,
  extractAbrTournamentId,
  extractNrdbDeckId,
  cardTypeLabel,
  formatCatalogDate,
  groupDeckCardsByType,
  normalizeCatalogText,
  sortDeckCards,
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

describe("deck card ordering", () => {
  it("sorts by card type, then quantity descending, then title", () => {
    const cards = [
      { title: "Sure Gamble", quantity: 3, type: "event" },
      { title: "Corroder", quantity: 1, type: "program" },
      { title: "The Maker's Eye", quantity: 2, type: "event" },
      { title: "Diesel", quantity: 3, type: "event" },
      { title: "Daily Casts", quantity: 3, type: "resource" },
    ];
    expect(sortDeckCards(cards).map((card) => card.title)).toEqual([
      "Diesel",
      "Sure Gamble",
      "The Maker's Eye",
      "Daily Casts",
      "Corroder",
    ]);
  });

  it("orders known types ahead of unknown or missing types and leaves input intact", () => {
    const cards = [
      { title: "Mystery Card", quantity: 2 },
      { title: "Hedge Fund", quantity: 3, type: "operation" },
      { title: "Legacy Card", quantity: 2, type: "console" },
    ];
    expect(sortDeckCards(cards).map((card) => card.title)).toEqual([
      "Hedge Fund",
      "Legacy Card",
      "Mystery Card",
    ]);
    expect(cards[0].title).toBe("Mystery Card");
  });
});

describe("deck card grouping", () => {
  it("labels NRDB type codes, treating ICE as an acronym", () => {
    expect(cardTypeLabel("ice")).toBe("ICE");
    expect(cardTypeLabel("operation")).toBe("Operation");
    expect(cardTypeLabel("console")).toBe("Console");
    expect(cardTypeLabel(undefined)).toBe("Other");
  });

  it("groups cards into canonical type sections with summed quantities", () => {
    const cards = [
      { title: "Corroder", quantity: 1, type: "program" },
      { title: "Sure Gamble", quantity: 3, type: "event" },
      { title: "Diesel", quantity: 3, type: "event" },
    ];
    expect(
      groupDeckCardsByType(cards).map((group) => ({
        label: group.label,
        quantity: group.quantity,
        titles: group.cards.map((card) => card.title),
      }))
    ).toEqual([
      { label: "Event", quantity: 6, titles: ["Diesel", "Sure Gamble"] },
      { label: "Program", quantity: 1, titles: ["Corroder"] },
    ]);
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
