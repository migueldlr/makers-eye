import { db } from "@/utils/drizzle/client";
import { unstable_cache } from "next/cache";
import { standings, tournamentDecklists, tournaments } from "@/db/schema";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  jsonToDeckCards,
  type CatalogAdminEventSummary,
  type CatalogDeckSummary,
  type CatalogDeckSnapshot,
  type CatalogEventDetail,
  type CatalogEventSummary,
  type DeckComparisonStatus,
  type DeckSide,
  type DeckSourceKind,
} from "./types";
import { formatCatalogDate } from "./util";

type DeckRow = typeof tournamentDecklists.$inferSelect;

function mapDeck(
  row: Omit<DeckRow, "cards"> & { cards?: DeckRow["cards"] }
): CatalogDeckSnapshot {
  return {
    id: row.id,
    standingId: row.standingId,
    side: row.side as DeckSide,
    sourceKind: row.sourceKind as DeckSourceKind,
    sourceUrl: row.sourceUrl,
    nrdbUrl: row.nrdbUrl,
    title: row.title,
    identity: row.identity,
    cards: jsonToDeckCards(row.cards ?? []),
    cardCount: row.cardCount,
    influenceTotal: row.influenceTotal,
    sourceHash: row.sourceHash,
    nrdbHash: row.nrdbHash,
    comparisonStatus: row.comparisonStatus as DeckComparisonStatus,
    importedAt: row.importedAt,
    lastVerifiedAt: row.lastVerifiedAt,
  };
}

async function getEventSummaries(
  includeUnpublished: boolean
): Promise<CatalogAdminEventSummary[]> {
  type SummaryRow = {
    abr_url: string | null;
    cobra_url: string | null;
    cardpool: string | null;
    catalog_published: boolean;
    cut_size: number;
    date: string | null;
    deck_count: number;
    format: string | null;
    id: number | string;
    last_modified_at: string | null;
    location: string | null;
    name: string | null;
    player_names: string[];
    region: string | null;
  };
  const eventRows = await db.execute<SummaryRow>(sql`
    select
      t.id,
      t.name,
      t.date,
      t.location,
      t.region,
      t.format,
      t.cardpool,
      case
        when t.url like 'https://tournaments.nullsignal.games/%' then t.url
        else null
      end as cobra_url,
      t.abr_url,
      t.catalog_published,
      t.last_modified_at,
      count(distinct s.id)::int as cut_size,
      count(distinct d.id) filter (
        where d.card_count > 0 and d.source_kind = 'cobra'
      )::int as deck_count,
      coalesce(
        jsonb_agg(distinct s.name) filter (where s.id is not null),
        '[]'::jsonb
      ) as player_names
    from tournaments t
    left join standings s
      on s.tournament_id = t.id and s.top_cut_rank > 0
    left join tournament_decklists d on d.standing_id = s.id
    where ${includeUnpublished ? sql`true` : sql`t.catalog_published = true`}
    group by t.id
    order by t.date desc nulls last, t.id desc
  `);

  return Array.from(eventRows).map((event) => {
    const date = event.date ?? "";
    return {
      id: Number(event.id),
      name: event.name ?? "Untitled event",
      date,
      displayDate: formatCatalogDate(date),
      location: event.location,
      region: event.region,
      format: event.format,
      cardpool: event.cardpool,
      cobraUrl: event.cobra_url,
      abrUrl: event.abr_url,
      cutSize: event.cut_size,
      deckCount: event.deck_count,
      playerNames: event.player_names,
      published: event.catalog_published,
      lastModifiedAt: event.last_modified_at,
    };
  });
}

export async function getCatalogEventSummaries(): Promise<
  CatalogEventSummary[]
> {
  const events = await getEventSummaries(false);
  const eventIds = events.map((event) => event.id);
  if (eventIds.length === 0) return [];

  const [playerRows, deckRows] = await Promise.all([
    db
      .select({
        id: standings.id,
        tournamentId: standings.tournamentId,
        name: standings.name,
        swissRank: standings.swissRank,
        topCutRank: standings.topCutRank,
        corpIdentity: standings.corpIdentity,
        runnerIdentity: standings.runnerIdentity,
      })
      .from(standings)
      .where(
        and(
          inArray(standings.tournamentId, eventIds),
          gt(standings.topCutRank, 0)
        )
      )
      .orderBy(
        asc(standings.tournamentId),
        asc(standings.topCutRank),
        asc(standings.swissRank)
      ),
    db
      .select({
        id: tournamentDecklists.id,
        standingId: tournamentDecklists.standingId,
        side: tournamentDecklists.side,
        nrdbUrl: tournamentDecklists.nrdbUrl,
        title: tournamentDecklists.title,
        identity: tournamentDecklists.identity,
        cardCount: tournamentDecklists.cardCount,
        influenceTotal: tournamentDecklists.influenceTotal,
      })
      .from(tournamentDecklists)
      .innerJoin(standings, eq(standings.id, tournamentDecklists.standingId))
      .where(
        and(
          inArray(standings.tournamentId, eventIds),
          gt(standings.topCutRank, 0),
          eq(tournamentDecklists.sourceKind, "cobra")
        )
      ),
  ]);

  const decksByStanding = new Map<
    number,
    Partial<Record<DeckSide, CatalogDeckSummary>>
  >();
  for (const deck of deckRows) {
    const current = decksByStanding.get(deck.standingId) ?? {};
    current[deck.side as DeckSide] = {
      id: deck.id,
      side: deck.side as DeckSide,
      nrdbUrl: deck.nrdbUrl,
      title: deck.title,
      identity: deck.identity,
      cardCount: deck.cardCount,
      influenceTotal: deck.influenceTotal,
    };
    decksByStanding.set(deck.standingId, current);
  }

  const playersByEvent = new Map<number, CatalogEventSummary["entrants"]>();
  for (const player of playerRows) {
    const current = playersByEvent.get(player.tournamentId) ?? [];
    current.push({
      name: player.name,
      swissRank: player.swissRank,
      topCutRank:
        player.topCutRank != null && player.topCutRank > 0
          ? player.topCutRank
          : null,
      corpIdentity: player.corpIdentity,
      runnerIdentity: player.runnerIdentity,
      decks: decksByStanding.get(player.id) ?? {},
    });
    playersByEvent.set(player.tournamentId, current);
  }

  return events.map(
    ({ published: _published, lastModifiedAt: _modified, ...event }) => ({
      ...event,
      entrants: playersByEvent.get(event.id) ?? [],
    })
  );
}

export const getCachedCatalogEventSummaries = unstable_cache(
  getCatalogEventSummaries,
  ["catalog-event-summaries"],
  { tags: ["catalog-events"] }
);

export async function getCatalogAdminEventSummaries(): Promise<
  CatalogAdminEventSummary[]
> {
  return getEventSummaries(true);
}

export async function getCatalogEventDetail(
  eventId: number,
  includeUnpublished = false,
  includeCards = true
): Promise<CatalogEventDetail | null> {
  const [event] = await db
    .select()
    .from(tournaments)
    .where(
      and(
        eq(tournaments.id, eventId),
        includeUnpublished
          ? undefined
          : eq(tournaments.catalogPublished, true)
      )
    )
    .limit(1);
  if (!event) return null;

  const playerRows = await db
    .select()
    .from(standings)
    .where(
      and(eq(standings.tournamentId, eventId), gt(standings.topCutRank, 0))
    )
    .orderBy(asc(standings.topCutRank), asc(standings.swissRank));
  const standingIds = playerRows.map((player) => player.id);
  const deckRows: Array<Omit<DeckRow, "cards"> & { cards?: DeckRow["cards"] }> =
    standingIds.length === 0
      ? []
      : includeCards
      ? await db
          .select()
          .from(tournamentDecklists)
          .where(inArray(tournamentDecklists.standingId, standingIds))
      : await db
          .select({
            id: tournamentDecklists.id,
            createdAt: tournamentDecklists.createdAt,
            updatedAt: tournamentDecklists.updatedAt,
            standingId: tournamentDecklists.standingId,
            side: tournamentDecklists.side,
            sourceKind: tournamentDecklists.sourceKind,
            sourceUrl: tournamentDecklists.sourceUrl,
            nrdbUrl: tournamentDecklists.nrdbUrl,
            title: tournamentDecklists.title,
            identity: tournamentDecklists.identity,
            cardCount: tournamentDecklists.cardCount,
            influenceTotal: tournamentDecklists.influenceTotal,
            sourceHash: tournamentDecklists.sourceHash,
            nrdbHash: tournamentDecklists.nrdbHash,
            comparisonStatus: tournamentDecklists.comparisonStatus,
            importedAt: tournamentDecklists.importedAt,
            lastVerifiedAt: tournamentDecklists.lastVerifiedAt,
          })
          .from(tournamentDecklists)
          .where(inArray(tournamentDecklists.standingId, standingIds));
  const decksByStanding = new Map<number, CatalogDeckSnapshot[]>();
  for (const deck of deckRows) {
    const current = decksByStanding.get(deck.standingId) ?? [];
    current.push(mapDeck(deck));
    decksByStanding.set(deck.standingId, current);
  }
  const date = event.date ?? "";

  return {
    id: event.id,
    name: event.name ?? "Untitled event",
    date,
    displayDate: formatCatalogDate(date),
    location: event.location,
    region: event.region,
    format: event.format,
    cardpool: event.cardpool,
    abrUrl: event.abrUrl,
    sourceUrl: event.url,
    published: event.catalogPublished,
    players: playerRows.map((player) => ({
      id: player.id,
      name: player.name,
      swissRank: player.swissRank,
      topCutRank: player.topCutRank ?? 0,
      corpIdentity: player.corpIdentity,
      runnerIdentity: player.runnerIdentity,
      sourcePlayerId: player.sourcePlayerId,
      decks: Object.fromEntries(
        (decksByStanding.get(player.id) ?? []).map((deck) => [deck.side, deck])
      ),
    })),
  };
}

export async function getPublishedCatalogDeck(
  deckId: number
): Promise<CatalogDeckSnapshot | null> {
  const [deck] = await db
    .select({
      id: tournamentDecklists.id,
      createdAt: tournamentDecklists.createdAt,
      updatedAt: tournamentDecklists.updatedAt,
      standingId: tournamentDecklists.standingId,
      side: tournamentDecklists.side,
      sourceKind: tournamentDecklists.sourceKind,
      sourceUrl: tournamentDecklists.sourceUrl,
      nrdbUrl: tournamentDecklists.nrdbUrl,
      title: tournamentDecklists.title,
      identity: tournamentDecklists.identity,
      cards: tournamentDecklists.cards,
      cardCount: tournamentDecklists.cardCount,
      influenceTotal: tournamentDecklists.influenceTotal,
      sourceHash: tournamentDecklists.sourceHash,
      nrdbHash: tournamentDecklists.nrdbHash,
      comparisonStatus: tournamentDecklists.comparisonStatus,
      importedAt: tournamentDecklists.importedAt,
      lastVerifiedAt: tournamentDecklists.lastVerifiedAt,
    })
    .from(tournamentDecklists)
    .innerJoin(standings, eq(standings.id, tournamentDecklists.standingId))
    .innerJoin(tournaments, eq(tournaments.id, standings.tournamentId))
    .where(
      and(
        eq(tournamentDecklists.id, deckId),
        eq(tournamentDecklists.sourceKind, "cobra"),
        eq(tournaments.catalogPublished, true)
      )
    )
    .limit(1);
  return deck ? mapDeck(deck) : null;
}
