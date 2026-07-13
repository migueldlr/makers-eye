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
    displayDate: "July 4, 2026",
    location: "Montréal",
    region: "Americas",
    format: "standard",
    cardpool: "Standard",
    cobraUrl: "https://tournaments.nullsignal.games/tournaments/10",
    abrUrl: "https://alwaysberunning.net/tournaments/10/example",
    cutSize: 8,
    deckCount: 16,
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
            nrdbUrl: null,
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
    displayDate: "June 1, 2026",
    location: "London",
    region: "Europe",
    format: "standard",
    cardpool: "Standard",
    cobraUrl: null,
    abrUrl: null,
    cutSize: 4,
    deckCount: 6,
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
    expect(fetchMock).toHaveBeenCalledWith("/decklists/decks/301");
    expect(fetchMock).toHaveBeenCalledWith("/decklists/decks/302");
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
});
