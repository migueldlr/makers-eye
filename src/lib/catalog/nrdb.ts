import type { CatalogDeckSnapshot, DeckCardRow, DeckSide } from "./types";
import {
  canonicalDeck,
  extractNrdbDeckId,
  normalizeCatalogText,
} from "./util";
import { fetchJsonWithValidators } from "./http";

type ParsedNrdbDeck = Omit<
  CatalogDeckSnapshot,
  | "standingId"
  | "sourceKind"
  | "sourceUrl"
  | "nrdbUrl"
  | "sourceHash"
  | "nrdbHash"
  | "comparisonStatus"
>;

type JsonApiResource = {
  id: string;
  attributes?: Record<string, unknown>;
};

type V2Card = {
  code: string;
  title: string;
  type_code?: string;
  side_code?: string;
};

export type NrdbDeckHints = {
  cards: DeckCardRow[];
  identity: string;
  identityPrintingId?: string;
  side: DeckSide;
};

export type NrdbAutoMatchInput = NrdbDeckHints & {
  title: string;
  cardCount: number;
};

export type NrdbAutoMatch = {
  url: string;
  deck: ParsedNrdbDeck;
};

let activeV2CardsRequest: Promise<V2Card[]> | null = null;

async function fetchV2Cards(): Promise<V2Card[]> {
  if (!activeV2CardsRequest) {
    activeV2CardsRequest = fetch("https://netrunnerdb.com/api/2.0/public/cards", {
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`NRDB cards returned ${response.status}.`);
      }
      const json = (await response.json()) as { data?: V2Card[] };
      return json.data ?? [];
    });
  }
  try {
    return await activeV2CardsRequest;
  } finally {
    activeV2CardsRequest = null;
  }
}

async function parseV3DeckResource(
  resource: JsonApiResource
): Promise<ParsedNrdbDeck> {
  if (!resource?.attributes) throw new Error("NRDB decklist was not found.");

  const deckId = resource.id;
  const attributes = resource.attributes;
  const slots = (attributes.card_slots ?? {}) as Record<string, number>;
  const { data: cardsJson } = await fetchJsonWithValidators<{
    data?: JsonApiResource[];
  }>(
    `https://api.netrunnerdb.com/api/v3/public/cards?filter[decklist_id]=${encodeURIComponent(
      deckId
    )}&page[size]=500`
  );
  const cardMap = new Map(
    (cardsJson.data ?? []).map((card) => [
      card.id,
      {
        title: String(card.attributes?.title ?? card.id),
        type: String(card.attributes?.card_type_id ?? ""),
      },
    ])
  );
  const identityId = String(attributes.identity_card_id ?? "");
  const cards: DeckCardRow[] = Object.entries(slots).flatMap(
    ([id, quantity]) =>
      id === identityId
        ? []
        : [
            {
              id,
              title: cardMap.get(id)?.title ?? id,
              quantity,
              ...(cardMap.get(id)?.type
                ? { type: cardMap.get(id)?.type }
                : {}),
            },
          ]
  );
  const side = attributes.side_id === "corp" ? "corp" : "runner";

  return {
    side,
    title: String(attributes.name ?? ""),
    identity: String(attributes.identity_card_id ?? ""),
    cards,
    cardCount:
      typeof attributes.num_cards === "number"
        ? attributes.num_cards
        : cards.reduce((total, card) => total + card.quantity, 0),
    influenceTotal:
      typeof attributes.influence_spent === "number"
        ? attributes.influence_spent
        : null,
  };
}

async function fetchV3Deck(deckId: string): Promise<ParsedNrdbDeck> {
  const { data: deckJson } = await fetchJsonWithValidators<{
    data?: JsonApiResource;
  }>(
    `https://api.netrunnerdb.com/api/v3/public/decklists/${encodeURIComponent(
      deckId
    )}`
  );
  const resource = deckJson.data;
  if (!resource) throw new Error("NRDB decklist was not found.");
  return parseV3DeckResource(resource);
}

function identityKey(value: string): string {
  return normalizeCatalogText(value.replaceAll("_", " ")).replace(
    /[^a-z0-9]/g,
    ""
  );
}

function safeNextPage(value: string | null | undefined): string | null {
  if (!value) return null;
  const url = new URL(value, "https://api.netrunnerdb.com");
  return url.protocol === "https:" && url.hostname === "api.netrunnerdb.com"
    ? url.toString()
    : null;
}

export async function findNrdbDeckByName(
  input: NrdbAutoMatchInput
): Promise<NrdbAutoMatch | null> {
  const normalizedTitle = normalizeCatalogText(input.title);
  if (!normalizedTitle || input.cards.length === 0) return null;

  const search = new URL(
    "https://api.netrunnerdb.com/api/v3/public/decklists"
  );
  search.searchParams.set("page[number]", "1");
  search.searchParams.set("page[size]", "20");
  search.searchParams.set("sort", "created_at");
  search.searchParams.set("filter[name][match]", input.title);

  const visited = new Set<string>();
  let pageUrl: string | null = search.toString();
  while (pageUrl && !visited.has(pageUrl)) {
    visited.add(pageUrl);
    const { data: result } = await fetchJsonWithValidators<{
      data?: JsonApiResource[];
      links?: { next?: string | null };
    }>(pageUrl);

    for (const candidate of result.data ?? []) {
      const attributes = candidate.attributes;
      if (
        !attributes ||
        !normalizeCatalogText(String(attributes.name ?? "")).includes(
          normalizedTitle
        ) ||
        attributes.side_id !== input.side ||
        attributes.num_cards !== input.cardCount ||
        identityKey(String(attributes.identity_card_id ?? "")) !==
          identityKey(input.identity)
      ) {
        continue;
      }

      const deck = await parseV3DeckResource(candidate);
      if (
        canonicalDeck(deck.cards, false) === canonicalDeck(input.cards, false)
      ) {
        return {
          url: `https://netrunnerdb.com/en/decklist/${candidate.id}`,
          deck,
        };
      }
    }

    pageUrl = safeNextPage(result.links?.next);
  }

  return null;
}

async function fetchV2Deck(
  deckId: string,
  hints?: NrdbDeckHints
): Promise<ParsedNrdbDeck> {
  const { data: deckJson } = await fetchJsonWithValidators<{
    data?: Array<{
      name?: string;
      cards?: Record<string, number>;
      identity_code?: string;
    }>;
  }>(`https://netrunnerdb.com/api/2.0/public/decklist/${deckId}`);
  const deck = deckJson.data?.[0];
  if (!deck) throw new Error("NRDB decklist was not found.");
  const bulkCards = hints?.identityPrintingId ? [] : await fetchV2Cards();
  const cardMap = new Map(bulkCards.map((card) => [card.code, card]));
  const identityCode =
    hints?.identityPrintingId ??
    deck.identity_code ??
    Object.keys(deck.cards ?? {}).find(
      (id) => cardMap.get(id)?.type_code === "identity"
    );
  const identityCard = identityCode ? cardMap.get(identityCode) : undefined;
  const hintedCards = new Map(
    (hints?.cards ?? []).flatMap((card) =>
      card.id ? [[card.id, card] as const] : []
    )
  );
  const cards: DeckCardRow[] = Object.entries(deck.cards ?? {}).flatMap(
    ([id, quantity]) =>
      id === identityCode || cardMap.get(id)?.type_code === "identity"
        ? []
        : [{
      id,
      title: hintedCards.get(id)?.title ?? cardMap.get(id)?.title ?? id,
      quantity,
      ...(cardMap.get(id)?.type_code
        ? { type: cardMap.get(id)?.type_code }
        : {}),
          }]
  );
  const side: DeckSide =
    hints?.side ?? (identityCard?.side_code === "corp" ? "corp" : "runner");
  return {
    side,
    title: deck.name ?? "",
    identity: hints?.identity ?? identityCard?.title ?? identityCode ?? "",
    cards,
    cardCount: cards.reduce((total, card) => total + card.quantity, 0),
    influenceTotal: null,
  };
}

export async function fetchNrdbDeck(
  url: string,
  hints?: NrdbDeckHints
): Promise<ParsedNrdbDeck> {
  const deckId = extractNrdbDeckId(url);
  if (!deckId) throw new Error("NRDB URL does not contain a decklist ID.");
  return deckId.includes("-") ? fetchV3Deck(deckId) : fetchV2Deck(deckId, hints);
}
