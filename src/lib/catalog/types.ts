import type { Json } from "@/lib/supabase";

export type DeckSide = "corp" | "runner";
export type DeckSourceKind = "cobra" | "nrdb" | "manual";
export type DeckComparisonStatus =
  | "identical"
  | "mismatch"
  | "unverified"
  | "unavailable";

export type DeckCardRow = {
  id?: string;
  title: string;
  quantity: number;
  influence?: number;
  type?: string;
};

export type CatalogDeckSnapshot = {
  id?: number;
  standingId: number;
  side: DeckSide;
  sourceKind: DeckSourceKind;
  sourceUrl: string | null;
  nrdbUrl: string | null;
  title: string;
  identity: string;
  cards: DeckCardRow[];
  cardCount: number;
  influenceTotal: number | null;
  sourceHash: string | null;
  nrdbHash: string | null;
  nrdbAutoMatched?: boolean;
  comparisonStatus: DeckComparisonStatus;
  importedAt?: string;
  lastVerifiedAt?: string | null;
};

export type CatalogDeckSummary = Pick<
  CatalogDeckSnapshot,
  | "id"
  | "side"
  | "nrdbUrl"
  | "title"
  | "identity"
  | "cardCount"
  | "influenceTotal"
>;

export type CatalogEntrantSummary = {
  name: string;
  swissRank: number;
  topCutRank: number | null;
  corpIdentity: string;
  runnerIdentity: string;
  decks: Partial<Record<DeckSide, CatalogDeckSummary>>;
};

type CatalogEventBaseSummary = {
  id: number;
  name: string;
  date: string;
  displayDate: string;
  location: string | null;
  region: string | null;
  format: string | null;
  cardpool: string | null;
  cobraUrl: string | null;
  abrUrl: string | null;
  cutSize: number;
  deckCount: number;
  playerNames: string[];
};

export type CatalogEventSummary = CatalogEventBaseSummary & {
  entrants: CatalogEntrantSummary[];
};

export type CatalogPlayer = {
  id: number;
  name: string;
  swissRank: number;
  topCutRank: number;
  corpIdentity: string;
  runnerIdentity: string;
  sourcePlayerId: string | null;
  decks: Partial<Record<DeckSide, CatalogDeckSnapshot>>;
};

export type CatalogEventDetail = {
  id: number;
  name: string;
  date: string;
  displayDate: string;
  location: string | null;
  region: string | null;
  format: string | null;
  cardpool: string | null;
  abrUrl: string | null;
  sourceUrl: string | null;
  published: boolean;
  players: CatalogPlayer[];
};

export type CatalogAdminEventSummary = CatalogEventBaseSummary & {
  published: boolean;
  lastModifiedAt: string | null;
};

export type SourcePlayerOption = {
  id: string;
  name: string;
};

export type AbrEntryOption = {
  key: string;
  name: string;
  rankSwiss: number;
  rankTop: number | null;
};

export type CatalogPlayerMapping = {
  standingId: number;
  sourcePlayerId?: string | null;
  abrEntryKey?: string | null;
};

export type RefreshPlayerPreview = {
  standingId: number;
  name: string;
  swissRank: number;
  topCutRank: number;
  sourcePlayerId: string | null;
  sourceMatch: "matched" | "ambiguous" | "unmatched";
  abrEntryKey: string | null;
  abrMatch: "matched" | "ambiguous" | "unmatched";
  decks: Partial<Record<DeckSide, CatalogDeckSnapshot>>;
  warnings: string[];
};

export type CatalogRefreshPreview = {
  tournamentId: number;
  generatedAt: string;
  abrUrl: string | null;
  abrAutoDetected: boolean;
  sourcePlayers: SourcePlayerOption[];
  abrEntries: AbrEntryOption[];
  entrantMappings: Array<{
    standingId: number;
    sourcePlayerId: string | null;
  }>;
  players: RefreshPlayerPreview[];
  warnings: string[];
};

export function jsonToDeckCards(value: Json | unknown): DeckCardRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }
    const row = item as Record<string, unknown>;
    if (typeof row.title !== "string" || typeof row.quantity !== "number") {
      return [];
    }
    return [
      {
        ...(typeof row.id === "string" ? { id: row.id } : {}),
        title: row.title,
        quantity: row.quantity,
        ...(typeof row.influence === "number"
          ? { influence: row.influence }
          : {}),
        ...(typeof row.type === "string" ? { type: row.type } : {}),
      },
    ];
  });
}
