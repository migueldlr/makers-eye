import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogEventSummary } from "@/lib/catalog/types";
import { CatalogClient } from "./CatalogClient";

const events: CatalogEventSummary[] = [
  {
    id: 10,
    name: "Méliès Megacity",
    date: "2026-07-04",
    displayDate: "4 July 2026",
    location: "Montréal",
    region: "Americas",
    format: "standard",
    cardpool: "Standard",
    banlist: "26.05",
    cobraUrl: "https://tournaments.nullsignal.games/tournaments/10",
    abrUrl: "https://alwaysberunning.net/tournaments/10/example",
    cutSize: 8,
    playerCount: 42,
    deckCount: 16,
    cobraDeckCount: 16,
    playerNames: ["René", "Matuszczak"],
    entrants: [
      {
        name: "René",
        swissRank: 1,
        topCutRank: 2,
        corpIdentity: "NBN: Reality Plus",
        runnerIdentity: "The Catalyst",
        decks: {
          corp: {
            id: 301,
            side: "corp",
            nrdbUrl: "https://netrunnerdb.com/en/decklist/abc/yellow-cards",
            title: "Yellow cards",
            identity: "NBN: Reality Plus",
            cardCount: 44,
            influenceTotal: 15,
          },
          runner: {
            id: 302,
            side: "runner",
            nrdbUrl: null,
            title: "Blue cards",
            identity: "The Catalyst",
            cardCount: 45,
            influenceTotal: 0,
          },
        },
      },
      {
        name: "Matuszczak",
        swissRank: 2,
        topCutRank: 4,
        corpIdentity: "Haas-Bioroid",
        runnerIdentity: "Arissana Rocha Nahu",
        decks: {},
      },
    ],
  },
  {
    id: 11,
    name: "London District",
    date: "2026-06-01",
    displayDate: "1 June 2026",
    location: "London",
    region: "Europe",
    format: "standard",
    cardpool: "Standard",
    banlist: "26.05",
    cobraUrl: null,
    abrUrl: null,
    cutSize: 4,
    playerCount: 20,
    deckCount: 6,
    cobraDeckCount: 6,
    playerNames: ["Alice"],
    entrants: [
      {
        name: "Alice",
        swissRank: 1,
        topCutRank: 1,
        corpIdentity: "Jinteki",
        runnerIdentity: "Hoshiko Shiro",
        decks: {},
      },
    ],
  },
];

const emptyEvent: CatalogEventSummary = {
  id: 20,
  name: "Ghost Cut Open",
  date: "2026-05-01",
  displayDate: "1 May 2026",
  location: "Online",
  region: "Europe",
  format: "standard",
  cardpool: "Standard",
  banlist: "26.05",
  cobraUrl: "https://tournaments.nullsignal.games/tournaments/20",
  abrUrl: null,
  cutSize: 4,
  playerCount: 12,
  deckCount: 0,
  cobraDeckCount: 0,
  playerNames: ["Nadia"],
  entrants: [
    {
      name: "Nadia",
      swissRank: 1,
      topCutRank: 1,
      corpIdentity: "NBN: Reality Plus",
      runnerIdentity: "The Catalyst",
      decks: {
        corp: {
          id: 501,
          side: "corp",
          nrdbUrl: "https://netrunnerdb.com/en/decklist/xyz/nadia-corp",
          title: "",
          identity: "",
          cardCount: 0,
          influenceTotal: null,
        },
      },
    },
  ],
};

const nrdbOnlyEvent: CatalogEventSummary = {
  ...emptyEvent,
  id: 21,
  name: "Imported From NRDB Open",
  deckCount: 2,
  cobraDeckCount: 0,
};

describe("CatalogClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders every top-cut entrant, hides Cobra IDs, and filters by player", () => {
    render(
      <MantineProvider>
        <CatalogClient events={events} />
      </MantineProvider>
    );
    expect(screen.getByText("Matuszczak")).toBeVisible();
    expect(screen.queryByText(/Cobra ID/)).toBeNull();
    expect(screen.getByText("R+")).toBeVisible();
    expect(screen.getAllByRole("columnheader", { name: "Corp" })).toHaveLength(2);
    expect(
      screen.getByText("4 July 2026 · Montréal · 26.05")
    ).toBeVisible();
    expect(screen.queryByText(/Standard/)).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: "Cut lists were not made public on Cobra :(",
      })
    ).toBeNull();
    expect(screen.queryByText(/\d+ cards/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "View corp deck on NetrunnerDB" })
    ).toHaveAttribute(
      "href",
      "https://netrunnerdb.com/en/decklist/abc/yellow-cards"
    );
    fireEvent.change(screen.getByLabelText("Search tournament entrants"), {
      target: { value: "rene" },
    });
    expect(screen.getByRole("heading", { name: "Méliès Megacity" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "London District" })).toBeNull();
    expect(screen.getByText("René")).toBeVisible();
    expect(screen.queryByText("Matuszczak")).toBeNull();
    expect(screen.getByRole("link", { name: /Cobra/ })).toHaveAttribute(
      "href",
      "https://tournaments.nullsignal.games/tournaments/10"
    );
  });

  it("loads both stored decklists when an entrant is opened", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const runner = url.endsWith("/302");
      return new Response(
        JSON.stringify({
          id: runner ? 302 : 301,
          standingId: 1,
          side: runner ? "runner" : "corp",
          sourceKind: "cobra",
          sourceUrl: "https://tournaments.nullsignal.games/tournaments/10/players/17/view_decks",
          nrdbUrl: null,
          title: runner ? "Blue cards" : "Yellow cards",
          identity: runner ? "The Catalyst" : "NBN: Reality Plus",
          cards: [
            {
              title: runner ? "Sure Gamble" : "Hedge Fund",
              quantity: 3,
              type: runner ? "event" : "operation",
            },
          ],
          cardCount: runner ? 45 : 44,
          influenceTotal: runner ? 0 : 15,
          sourceHash: "source",
          nrdbHash: null,
          comparisonStatus: "unverified",
        }),
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MantineProvider>
        <CatalogClient events={events} />
      </MantineProvider>
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Open decklists for René" })
    );
    expect(await screen.findByText("Hedge Fund")).toBeVisible();
    expect(await screen.findByText("Sure Gamble")).toBeVisible();
    expect(screen.getByText("Operation (3)")).toBeVisible();
    expect(screen.getByText("Event (3)")).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: "Cobra" }).map((link) =>
        link.getAttribute("href")
      )
    ).toContain(
      "https://tournaments.nullsignal.games/tournaments/10/players/17/view_decks"
    );
    expect(fetchMock).toHaveBeenCalledWith("/decklists/decks/301");
    expect(fetchMock).toHaveBeenCalledWith("/decklists/decks/302");
  });

  it("filters by shortened identity name", () => {
    render(
      <MantineProvider>
        <CatalogClient events={events} />
      </MantineProvider>
    );
    fireEvent.change(screen.getByLabelText("Search tournament entrants"), {
      target: { value: "R+" },
    });
    expect(screen.getByRole("heading", { name: "Méliès Megacity" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "London District" })).toBeNull();
    expect(screen.getByText("René")).toBeVisible();
    expect(screen.queryByText("Matuszczak")).toBeNull();
  });

  it("shows a directed no-results state", () => {
    render(
      <MantineProvider>
        <CatalogClient events={events} />
      </MantineProvider>
    );
    fireEvent.change(screen.getByLabelText("Search tournament entrants"), {
      target: { value: "not a real event" },
    });
    expect(screen.getByText("No events or entrants match this search.")).toBeVisible();
  });

  it("notes missing Cobra lists but still shows NRDB links for empty events", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MantineProvider>
        <CatalogClient events={[emptyEvent]} />
      </MantineProvider>
    );
    expect(
      screen.getByRole("button", {
        name: "Cut lists were not made public on Cobra :(",
      })
    ).toBeVisible();
    expect(screen.getByText("Top 4 · 12 players")).toBeVisible();
    expect(screen.getByText("1 May 2026 · 26.05")).toBeVisible();
    expect(screen.queryByText(/Online/)).toBeNull();
    expect(screen.queryByText(/lists$/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "View corp deck on NetrunnerDB" })
    ).toHaveAttribute(
      "href",
      "https://netrunnerdb.com/en/decklist/xyz/nadia-corp"
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open decklists for Nadia" })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the Cobra disclaimer when lists came from NRDB, not Cobra", () => {
    render(
      <MantineProvider>
        <CatalogClient events={[nrdbOnlyEvent]} />
      </MantineProvider>
    );
    expect(
      screen.getByRole("button", {
        name: "Cut lists were not made public on Cobra :(",
      })
    ).toBeVisible();
    expect(screen.getByText("Top 4 · 12 players · 2 lists")).toBeVisible();
  });
});
