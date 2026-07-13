import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNrdbDeck, findNrdbDeckByName } from "./nrdb";

function candidate(id: string, name: string, cardId = "hedge_fund") {
  return {
    id,
    attributes: {
      name,
      side_id: "corp",
      identity_card_id: "nbn_reality_plus",
      num_cards: 3,
      card_slots: { [cardId]: 3 },
    },
  };
}

describe("fetchNrdbDeck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("finds the identity in current v2 deck card slots", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/decklist/97183")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  name: "High Speed Rail",
                  cards: { "30035": 1, "26036": 3 },
                },
              ],
            })
          );
        }
        return new Response(
          JSON.stringify({
            data: [
              {
                code: "30035",
                title: "Haas-Bioroid: Precision Design",
                type_code: "identity",
                side_code: "corp",
              },
              {
                code: "26036",
                title: "Fully Operational",
                type_code: "operation",
                side_code: "corp",
              },
            ],
          })
        );
      })
    );

    await expect(
      fetchNrdbDeck("https://netrunnerdb.com/en/decklist/97183")
    ).resolves.toMatchObject({
      side: "corp",
      identity: "Haas-Bioroid: Precision Design",
      cards: [
        {
          id: "26036",
          title: "Fully Operational",
          quantity: 3,
          type: "operation",
        },
      ],
      cardCount: 3,
    });
  });

  it("uses Cobra printing hints without downloading the full card catalog", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [
            {
              name: "High Speed Rail",
              cards: { "30035": 1, "26036": 3 },
            },
          ],
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const deck = await fetchNrdbDeck(
      "https://netrunnerdb.com/en/decklist/97183",
      {
        side: "corp",
        identity: "Haas-Bioroid: Precision Design",
        identityPrintingId: "30035",
        cards: [
          {
            id: "26036",
            title: "Fully Operational",
            quantity: 3,
          },
        ],
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(deck).toMatchObject({
      side: "corp",
      cardCount: 3,
      cards: [{ id: "26036", title: "Fully Operational", quantity: 3 }],
    });
  });

  it("loads UUID decklists from the direct V3 endpoint and excludes identity slots", async () => {
    const deckId = "55555555-5555-5555-5555-555555555555";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/cards?")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  id: "nbn_reality_plus",
                  attributes: {
                    title: "NBN: Reality Plus",
                    card_type_id: "corp_identity",
                  },
                },
                {
                  id: "hedge_fund",
                  attributes: { title: "Hedge Fund", card_type_id: "operation" },
                },
              ],
            })
          );
        }
        const deck = candidate(deckId, "Direct Wolf");
        return new Response(
          JSON.stringify({
            data: {
              ...deck,
              attributes: {
                ...deck.attributes,
                card_slots: { nbn_reality_plus: 1, hedge_fund: 3 },
              },
            },
          })
        );
      })
    );

    await expect(
      fetchNrdbDeck(`https://netrunnerdb.com/en/decklist/${deckId}`)
    ).resolves.toMatchObject({
      side: "corp",
      title: "Direct Wolf",
      cardCount: 3,
      cards: [{ id: "hedge_fund", title: "Hedge Fund", quantity: 3 }],
    });
  });

  it("chooses the oldest exact title, identity, and card match", async () => {
    const oldestId = "11111111-1111-1111-1111-111111111111";
    const newerId = "22222222-2222-2222-2222-222222222222";
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/cards?")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "hedge_fund",
                attributes: { title: "Hedge Fund", card_type_id: "operation" },
              },
            ],
          })
        );
      }
      return new Response(
        JSON.stringify({
          data: [
            candidate(oldestId, "Shared Wolf (original)"),
            candidate(newerId, "Shared Wolf"),
          ],
          links: { next: null },
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      findNrdbDeckByName({
        title: "Shared Wolf",
        side: "corp",
        identity: "NBN: Reality Plus",
        identityPrintingId: "33054",
        cards: [{ id: "30042", title: "Hedge Fund", quantity: 3 }],
        cardCount: 3,
      })
    ).resolves.toMatchObject({
      url: `https://netrunnerdb.com/en/decklist/${oldestId}`,
      deck: { title: "Shared Wolf (original)", side: "corp" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a title-only match and continues to the next page", async () => {
    const mismatchedId = "33333333-3333-3333-3333-333333333333";
    const matchedId = "44444444-4444-4444-4444-444444444444";
    const nextPage =
      "https://api.netrunnerdb.com/api/v3/public/decklists?page%5Bnumber%5D=2";
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/cards?")) {
        const mismatch = url.includes(mismatchedId);
        return new Response(
          JSON.stringify({
            data: [
              {
                id: mismatch ? "spin_doctor" : "hedge_fund",
                attributes: {
                  title: mismatch ? "Spin Doctor" : "Hedge Fund",
                  card_type_id: mismatch ? "asset" : "operation",
                },
              },
            ],
          })
        );
      }
      if (url === nextPage) {
        return new Response(
          JSON.stringify({
            data: [candidate(matchedId, "Paged Wolf")],
            links: { next: null },
          })
        );
      }
      return new Response(
        JSON.stringify({
          data: [candidate(mismatchedId, "Paged Wolf", "spin_doctor")],
          links: { next: nextPage },
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      findNrdbDeckByName({
        title: "Paged Wolf",
        side: "corp",
        identity: "NBN: Reality Plus",
        cards: [{ id: "30042", title: "Hedge Fund", quantity: 3 }],
        cardCount: 3,
      })
    ).resolves.toMatchObject({
      url: `https://netrunnerdb.com/en/decklist/${matchedId}`,
    });
    expect(fetchMock).toHaveBeenCalledWith(nextPage, expect.anything());
  });
});
