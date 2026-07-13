import type {
  CatalogEntrantSummary,
  CatalogEventSummary,
  DeckCardRow,
} from "./types";

export function normalizeCatalogText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[“”‘’]/g, "'")
    .replace(/['"]/g, "")
    .replace(/^[\s.,/#!$%^&*;:{}=_?()-]+/, "")
    .replace(/[\s.,/#!$%^&*;:{}=_?()-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatCatalogDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function catalogEventMatchesSearch(
  event: CatalogEventSummary,
  query: string
): boolean {
  const normalizedQuery = normalizeCatalogText(query);
  if (normalizedQuery === "") return true;
  return (
    catalogEventMetadataMatchesSearch(event, normalizedQuery) ||
    event.entrants.some((entrant) =>
      catalogEntrantMatchesSearch(entrant, normalizedQuery)
    )
  );
}

export function catalogEventMetadataMatchesSearch(
  event: CatalogEventSummary,
  query: string
): boolean {
  const normalizedQuery = normalizeCatalogText(query);
  if (!normalizedQuery) return true;
  return normalizeCatalogText(
    [event.name, event.date, event.displayDate, event.location, event.region]
      .filter(Boolean)
      .join(" ")
  ).includes(normalizedQuery);
}

export function catalogEntrantMatchesSearch(
  entrant: CatalogEntrantSummary,
  query: string
): boolean {
  const normalizedQuery = normalizeCatalogText(query);
  if (!normalizedQuery) return true;
  return normalizeCatalogText(entrant.name).includes(normalizedQuery);
}

// Canonical Netrunner card-type ordering, mirroring the classifier's
// DecklistDisplay. Cards with an unknown or missing type sort last.
const CARD_TYPE_ORDER = [
  "identity",
  "agenda",
  "asset",
  "operation",
  "upgrade",
  "ice",
  "event",
  "hardware",
  "resource",
  "program",
];

function cardTypeRank(type: string | undefined): number {
  const index = type ? CARD_TYPE_ORDER.indexOf(type) : -1;
  return index === -1 ? CARD_TYPE_ORDER.length : index;
}

// Sorts a decklist by card type, then by quantity (descending), then by title.
// Returns a new array; the input is not mutated.
export function sortDeckCards(cards: DeckCardRow[]): DeckCardRow[] {
  return [...cards].sort((a, b) => {
    const typeDelta = cardTypeRank(a.type) - cardTypeRank(b.type);
    if (typeDelta !== 0) return typeDelta;
    if (a.quantity !== b.quantity) return b.quantity - a.quantity;
    return a.title.localeCompare(b.title);
  });
}

// NRDB card-type codes render lowercase; most just capitalize, ICE is an
// acronym. Unknown or missing types fall back to a generic label.
const CARD_TYPE_LABELS: Record<string, string> = {
  identity: "Identity",
  agenda: "Agenda",
  asset: "Asset",
  operation: "Operation",
  upgrade: "Upgrade",
  ice: "ICE",
  event: "Event",
  hardware: "Hardware",
  resource: "Resource",
  program: "Program",
};

export function cardTypeLabel(type: string | undefined): string {
  if (!type) return "Other";
  return CARD_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

export type DeckCardGroup = {
  type: string | undefined;
  label: string;
  quantity: number;
  cards: DeckCardRow[];
};

// Sorts the deck, then groups consecutive cards of the same type into
// labelled sections for divider headers. Every known type sorts into its
// canonical slot, so consecutive grouping keeps each type in one section.
export function groupDeckCardsByType(cards: DeckCardRow[]): DeckCardGroup[] {
  const groups: DeckCardGroup[] = [];
  for (const card of sortDeckCards(cards)) {
    const last = groups[groups.length - 1];
    if (last && last.type === card.type) {
      last.cards.push(card);
      last.quantity += card.quantity;
    } else {
      groups.push({
        type: card.type,
        label: cardTypeLabel(card.type),
        quantity: card.quantity,
        cards: [card],
      });
    }
  }
  return groups;
}

export function canonicalDeck(
  cards: DeckCardRow[],
  useIds = cards.every((card) => Boolean(card.id))
): string {
  return cards
    .map((card) => ({
      title:
        useIds && card.id
          ? `id:${card.id}`
          : `title:${normalizeCatalogText(card.title)}`,
      quantity: card.quantity,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((card) => `${card.quantity}x:${card.title}`)
    .join("|");
}

export function compareDecks(
  cobraCards: DeckCardRow[],
  nrdbCards: DeckCardRow[]
): "identical" | "mismatch" {
  const useIds = [...cobraCards, ...nrdbCards].every((card) => Boolean(card.id));
  return canonicalDeck(cobraCards, useIds) === canonicalDeck(nrdbCards, useIds)
    ? "identical"
    : "mismatch";
}

export function validateExternalUrl(
  value: string | null | undefined,
  hosts: string[]
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a complete https URL.");
  }
  if (url.protocol !== "https:" || !hosts.includes(url.hostname)) {
    throw new Error(`URL must use https on ${hosts.join(" or ")}.`);
  }
  return url.toString();
}

export function extractAbrTournamentId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname !== "alwaysberunning.net") return null;
    const match = url.pathname.match(/^\/tournaments\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function extractNrdbDeckId(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      !["netrunnerdb.com", "www.netrunnerdb.com"].includes(url.hostname)
    ) {
      return null;
    }
    const match = url.pathname.match(/^\/(?:[a-z]{2}\/)?decklist\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
