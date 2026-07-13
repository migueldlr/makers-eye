"use server";

import { createHash } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { standings, tournamentDecklists, tournaments } from "@/db/schema";
import { detectAbrTournament, getAbrDeckUrls, type AbrEntry } from "@/lib/abr";
import { fetchCobraDeckPage } from "@/lib/catalog/cobra";
import { fetchNrdbDeck, findNrdbDeckByName } from "@/lib/catalog/nrdb";
import { fetchJsonWithValidators } from "@/lib/catalog/http";
import { getCatalogEventDetail } from "@/lib/catalog/queries";
import type {
  AbrEntryOption,
  CatalogDeckSnapshot,
  CatalogPlayerMapping,
  CatalogRefreshPreview,
  DeckSide,
  RefreshPlayerPreview,
  SourcePlayerOption,
} from "@/lib/catalog/types";
import {
  canonicalDeck,
  compareDecks,
  extractAbrTournamentId,
  normalizeCatalogText,
  validateExternalUrl,
} from "@/lib/catalog/util";
import type { Tournament } from "@/lib/types";
import { parseUrl, URLS } from "@/lib/util";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/utils/drizzle/client";

type SaveCatalogEventInput = {
  id: number;
  name: string;
  date: string;
  location: string | null;
  region: string | null;
  format: string | null;
  cardpool: string | null;
  sourceUrl: string | null;
  abrUrl: string | null;
  published: boolean;
};

type ImportAndPublishInput = {
  event: Omit<SaveCatalogEventInput, "published">;
  preview: CatalogRefreshPreview;
};

type SavePlayerLinksInput = {
  tournamentId: number;
  players: Array<{
    standingId: number;
    sourcePlayerId: string | null;
    corpNrdbUrl: string | null;
    runnerNrdbUrl: string | null;
  }>;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sign in to manage the decklist catalog.");
  return user;
}

function revalidateCatalog(tournamentId: number) {
  revalidateTag("catalog-events");
  revalidatePath("/decklists");
  revalidatePath("/dashboard/decklists");
}

function nullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function findUniqueByName<T extends { name: string }>(
  name: string,
  candidates: T[]
): { item: T | null; status: "matched" | "ambiguous" | "unmatched" } {
  const normalized = normalizeCatalogText(name);
  const matches = candidates.filter(
    (candidate) => normalizeCatalogText(candidate.name) === normalized
  );
  if (matches.length === 1) return { item: matches[0], status: "matched" };
  if (matches.length > 1) return { item: null, status: "ambiguous" };
  return { item: null, status: "unmatched" };
}

function abrEntryName(entry: AbrEntry) {
  return entry.user_import_name?.trim() || entry.user_name?.trim() || "";
}

function abrEntryKey(entry: AbrEntry, index: number) {
  return `${index}:${entry.user_id}:${entry.rank_swiss}:${abrEntryName(entry)}`;
}

function hashCards(cards: CatalogDeckSnapshot["cards"]) {
  return createHash("sha256").update(canonicalDeck(cards)).digest("hex");
}

async function fetchTournamentSource(url: string | null) {
  if (!url) return { tournament: null, site: null, sourceId: null };
  const parsed = parseUrl(url);
  if (!parsed) return { tournament: null, site: null, sourceId: null };
  const [site, sourceId] = parsed;
  const { data: tournament } = await fetchJsonWithValidators<Tournament>(
    `${URLS[site as keyof typeof URLS]}${sourceId}.json`
  );
  return {
    tournament,
    site,
    sourceId,
  };
}

async function fetchAbrEntries(url: string | null) {
  if (!url) return [];
  const id = extractAbrTournamentId(url);
  if (!id) throw new Error("The ABR URL does not contain a tournament ID.");
  const response = await fetch(
    `https://alwaysberunning.net/api/entries?id=${encodeURIComponent(id)}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(`ABR returned ${response.status}.`);
  return (await response.json()) as AbrEntry[];
}

function getMapping(
  standingId: number,
  mappings: CatalogPlayerMapping[]
): CatalogPlayerMapping | undefined {
  return mappings.find((mapping) => mapping.standingId === standingId);
}

async function buildDeckSnapshot({
  standingId,
  side,
  sourceUrl,
  cobraDeck,
  nrdbUrl,
}: {
  standingId: number;
  side: DeckSide;
  sourceUrl: string | null;
  cobraDeck?: Awaited<ReturnType<typeof fetchCobraDeckPage>>[DeckSide];
  nrdbUrl: string | null;
}): Promise<{ deck?: CatalogDeckSnapshot; warnings: string[] }> {
  const warnings: string[] = [];
  let acceptedNrdbUrl = nrdbUrl;
  let nrdbDeck: Awaited<ReturnType<typeof fetchNrdbDeck>> | undefined;
  let nrdbAutoMatched = false;
  if (nrdbUrl) {
    try {
      nrdbDeck = await fetchNrdbDeck(
        nrdbUrl,
        cobraDeck
          ? {
              cards: cobraDeck.cards,
              identity: cobraDeck.identity,
              identityPrintingId: cobraDeck.identityPrintingId,
              side,
            }
          : undefined
      );
      if (nrdbDeck.side !== side) {
        warnings.push(`The ${side} NRDB link points to a ${nrdbDeck.side} deck.`);
        nrdbDeck = undefined;
        acceptedNrdbUrl = null;
      }
    } catch (error) {
      warnings.push(
        `${side === "corp" ? "Corp" : "Runner"} NRDB check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  } else if (cobraDeck) {
    try {
      const match = await findNrdbDeckByName({
        title: cobraDeck.title,
        identity: cobraDeck.identity,
        identityPrintingId: cobraDeck.identityPrintingId,
        cards: cobraDeck.cards,
        cardCount: cobraDeck.cardCount,
        side,
      });
      if (match) {
        acceptedNrdbUrl = match.url;
        nrdbDeck = match.deck;
        nrdbAutoMatched = true;
      }
    } catch (error) {
      warnings.push(
        `${side === "corp" ? "Corp" : "Runner"} NRDB automatch failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  if (!cobraDeck) {
    if (nrdbDeck) {
      warnings.push(
        `${side === "corp" ? "Corp" : "Runner"} has an NRDB link but no Cobra submission, so no list will be imported.`
      );
    }
    return { warnings };
  }
  const comparisonStatus =
    nrdbAutoMatched
      ? "identical"
      : nrdbDeck
      ? compareDecks(cobraDeck.cards, nrdbDeck.cards)
      : nrdbUrl && !nrdbDeck
      ? "unavailable"
      : "unverified";
  if (comparisonStatus === "mismatch") {
    warnings.push(
      `${side === "corp" ? "Corp" : "Runner"} NRDB deck “${
        nrdbDeck?.title || "Untitled deck"
      }” matches the correct side, but its cards differ from the Cobra submission.`
    );
  }

  return {
    warnings,
    deck: {
      standingId,
      side,
      sourceKind: "cobra",
      sourceUrl,
      nrdbUrl: acceptedNrdbUrl,
      title: cobraDeck.title,
      identity: cobraDeck.identity,
      cards: cobraDeck.cards,
      cardCount: cobraDeck.cardCount,
      influenceTotal: cobraDeck.influenceTotal,
      sourceHash: hashCards(cobraDeck.cards),
      nrdbHash: nrdbDeck ? hashCards(nrdbDeck.cards) : null,
      ...(nrdbAutoMatched ? { nrdbAutoMatched: true } : {}),
      comparisonStatus,
      lastVerifiedAt: new Date().toISOString(),
    },
  };
}

export async function previewCatalogRefresh(
  tournamentId: number,
  mappings: CatalogPlayerMapping[] = []
): Promise<CatalogRefreshPreview> {
  await requireUser();
  const [event, allEntrants] = await Promise.all([
    getCatalogEventDetail(tournamentId, true, false),
    db
      .select({
        id: standings.id,
        name: standings.name,
        sourcePlayerId: standings.sourcePlayerId,
      })
      .from(standings)
      .where(eq(standings.tournamentId, tournamentId)),
  ]);
  if (!event) throw new Error("Tournament not found.");
  const warnings: string[] = [];

  let tournamentSource: Awaited<ReturnType<typeof fetchTournamentSource>> = {
    tournament: null,
    site: null,
    sourceId: null,
  };
  try {
    tournamentSource = await fetchTournamentSource(event.sourceUrl);
  } catch (error) {
    warnings.push(
      `Tournament source failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
  let resolvedAbrUrl = event.abrUrl;
  let abrAutoDetected = false;
  if (!resolvedAbrUrl && tournamentSource.tournament) {
    try {
      const detected = await detectAbrTournament({
        name: tournamentSource.tournament.name ?? event.name,
        date: tournamentSource.tournament.date ?? event.date,
        city: tournamentSource.tournament.city,
        country: tournamentSource.tournament.country,
        playerCount: tournamentSource.tournament.players?.length,
        cutSize:
          tournamentSource.tournament.cutToTop ?? event.players.length,
      });
      if (detected.status === "matched" && detected.tournament) {
        resolvedAbrUrl = detected.tournament.url;
        abrAutoDetected = true;
      } else if (detected.status === "ambiguous") {
        warnings.push(
          "Multiple ABR tournaments matched this event. Add the ABR URL manually."
        );
      }
    } catch (error) {
      warnings.push(
        `ABR tournament detection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  let abrEntries: AbrEntry[] = [];
  try {
    abrEntries = await fetchAbrEntries(resolvedAbrUrl);
  } catch (error) {
    warnings.push(
      `ABR failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  const sourcePlayers: SourcePlayerOption[] = (
    tournamentSource.tournament?.players ?? []
  ).flatMap((player) =>
    player.id == null || !player.name
      ? []
      : [{ id: String(player.id), name: player.name }]
  );
  const abrOptions: AbrEntryOption[] = abrEntries.flatMap((entry, index) => {
    const name = abrEntryName(entry);
    return name
      ? [
          {
            key: abrEntryKey(entry, index),
            name,
            rankSwiss: entry.rank_swiss,
            rankTop: entry.rank_top,
          },
        ]
      : [];
  });
  const entrantMappings = allEntrants.map((entrant) => {
    const mapping = getMapping(entrant.id, mappings);
    const automaticSource = findUniqueByName(entrant.name, sourcePlayers);
    return {
      standingId: entrant.id,
      sourcePlayerId:
        mapping?.sourcePlayerId ??
        entrant.sourcePlayerId ??
        automaticSource.item?.id ??
        null,
    };
  });

  const players = await Promise.all(
    event.players.map(async (player): Promise<RefreshPlayerPreview> => {
      const mapping = getMapping(player.id, mappings);
      const automaticSource = findUniqueByName(player.name, sourcePlayers);
      const mappedSourceId =
        mapping?.sourcePlayerId ??
        player.sourcePlayerId ??
        automaticSource.item?.id ??
        null;
      const selectedSource = sourcePlayers.find(
        (candidate) => candidate.id === mappedSourceId
      );
      const sourceMatch = selectedSource ? "matched" : automaticSource.status;

      const abrCandidates = abrOptions.map((entry) => ({
        ...entry,
        name: entry.name,
      }));
      const automaticAbr = findUniqueByName(player.name, abrCandidates);
      const mappedAbrKey =
        mapping?.abrEntryKey ?? automaticAbr.item?.key ?? null;
      const selectedAbrIndex = mappedAbrKey
        ? Number.parseInt(mappedAbrKey.split(":")[0], 10)
        : -1;
      const selectedAbr = abrEntries[selectedAbrIndex];
      const playerWarnings: string[] = [];
      let cobraDecks: Awaited<ReturnType<typeof fetchCobraDeckPage>> = {};
      let sourceUrl: string | null = null;

      if (
        tournamentSource.site === "cobra" &&
        tournamentSource.sourceId &&
        mappedSourceId
      ) {
        sourceUrl = `${URLS.cobra}${tournamentSource.sourceId}/players/${mappedSourceId}/view_decks?back_to=standings`;
        try {
          cobraDecks = await fetchCobraDeckPage(sourceUrl);
          if (!cobraDecks.corp && !cobraDecks.runner) {
            playerWarnings.push("Cobra does not expose a submitted list for this player.");
          }
        } catch (error) {
          playerWarnings.push(
            `Cobra deck fetch failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      } else if (tournamentSource.site === "cobra") {
        playerWarnings.push("Choose the matching Cobra player to import submitted lists.");
      }

      const abrDeckUrls = getAbrDeckUrls(selectedAbr);
      const corpNrdbUrl =
        abrDeckUrls.corp ?? player.decks.corp?.nrdbUrl ?? null;
      const runnerNrdbUrl =
        abrDeckUrls.runner ?? player.decks.runner?.nrdbUrl ?? null;
      const [corpResult, runnerResult] = await Promise.all([
        buildDeckSnapshot({
          standingId: player.id,
          side: "corp",
          sourceUrl,
          cobraDeck: cobraDecks.corp,
          nrdbUrl: corpNrdbUrl,
        }),
        buildDeckSnapshot({
          standingId: player.id,
          side: "runner",
          sourceUrl,
          cobraDeck: cobraDecks.runner,
          nrdbUrl: runnerNrdbUrl,
        }),
      ]);
      playerWarnings.push(...corpResult.warnings, ...runnerResult.warnings);

      return {
        standingId: player.id,
        name: player.name,
        swissRank: player.swissRank,
        topCutRank: player.topCutRank,
        sourcePlayerId: mappedSourceId,
        sourceMatch,
        abrEntryKey: mappedAbrKey,
        abrMatch: selectedAbr ? "matched" : automaticAbr.status,
        decks: {
          ...(corpResult.deck ? { corp: corpResult.deck } : {}),
          ...(runnerResult.deck ? { runner: runnerResult.deck } : {}),
        },
        warnings: playerWarnings,
      };
    })
  );

  return {
    tournamentId,
    generatedAt: new Date().toISOString(),
    abrUrl: resolvedAbrUrl,
    abrAutoDetected,
    sourcePlayers,
    abrEntries: abrOptions,
    entrantMappings,
    players,
    warnings,
  };
}

export async function applyCatalogRefresh(preview: CatalogRefreshPreview) {
  await requireUser();
  const abrUrl = validateExternalUrl(preview.abrUrl, ["alwaysberunning.net"]);
  const standingIds = preview.entrantMappings.map(
    (entrant) => entrant.standingId
  );
  const validRows =
    standingIds.length === 0
      ? []
      : await db
          .select({ id: standings.id })
          .from(standings)
          .where(
            and(
              eq(standings.tournamentId, preview.tournamentId),
              inArray(standings.id, standingIds)
            )
          );
  if (validRows.length !== standingIds.length) {
    throw new Error("Refresh contains a player outside this tournament.");
  }

  await db.transaction(async (transaction) => {
    for (const entrant of preview.entrantMappings) {
      await transaction
        .update(standings)
        .set({ sourcePlayerId: entrant.sourcePlayerId })
        .where(eq(standings.id, entrant.standingId));
    }
    for (const player of preview.players) {
      for (const deck of Object.values(player.decks)) {
        if (!deck) continue;
        const values = {
          standingId: deck.standingId,
          side: deck.side,
          sourceKind: deck.sourceKind,
          sourceUrl: deck.sourceUrl,
          nrdbUrl: deck.nrdbUrl,
          title: deck.title,
          identity: deck.identity,
          cards: deck.cards,
          cardCount: deck.cardCount,
          influenceTotal: deck.influenceTotal,
          sourceHash: deck.sourceHash,
          nrdbHash: deck.nrdbHash,
          comparisonStatus: deck.comparisonStatus,
          updatedAt: new Date().toISOString(),
          importedAt: new Date().toISOString(),
          lastVerifiedAt: deck.lastVerifiedAt ?? new Date().toISOString(),
        };
        await transaction
          .insert(tournamentDecklists)
          .values(values)
          .onConflictDoUpdate({
            target: [tournamentDecklists.standingId, tournamentDecklists.side],
            set: values,
          });
      }
    }
    await transaction
      .update(tournaments)
      .set({
        lastModifiedAt: new Date().toISOString(),
        ...(abrUrl ? { abrUrl } : {}),
      })
      .where(eq(tournaments.id, preview.tournamentId));
  });

  revalidateCatalog(preview.tournamentId);
  return { ok: true };
}

export async function importAndPublishCatalogEvent({
  event: input,
  preview,
}: ImportAndPublishInput) {
  await requireUser();
  if (input.id !== preview.tournamentId) {
    throw new Error("Import preview belongs to a different tournament.");
  }

  const name = input.name.trim();
  const date = input.date.trim();
  if (!name || !date) throw new Error("Published events need a name and date.");
  if (preview.players.length === 0) {
    throw new Error("Published events need at least one top-cut player.");
  }

  const sourceUrl = validateExternalUrl(nullable(input.sourceUrl), [
    "tournaments.nullsignal.games",
    "www.aesopstables.net",
  ]);
  const abrUrl = validateExternalUrl(
    preview.abrUrl ?? nullable(input.abrUrl),
    ["alwaysberunning.net"]
  );
  const standingIds = preview.entrantMappings.map(
    (entrant) => entrant.standingId
  );
  const deckValues = preview.players.flatMap((player) =>
    Object.values(player.decks).flatMap((deck) => {
      if (!deck) return [];
      const now = new Date().toISOString();
      return [
        {
          standingId: deck.standingId,
          side: deck.side,
          sourceKind: deck.sourceKind,
          sourceUrl: deck.sourceUrl,
          nrdbUrl: deck.nrdbUrl,
          title: deck.title,
          identity: deck.identity,
          cards: deck.cards,
          cardCount: deck.cardCount,
          influenceTotal: deck.influenceTotal,
          sourceHash: deck.sourceHash,
          nrdbHash: deck.nrdbHash,
          comparisonStatus: deck.comparisonStatus,
          updatedAt: now,
          importedAt: now,
          lastVerifiedAt: deck.lastVerifiedAt ?? now,
        },
      ];
    })
  );
  if (!deckValues.some((deck) => deck.cardCount > 0)) {
    throw new Error("Import at least one submitted deck before publishing.");
  }

  const [currentEvent, validRows] = await Promise.all([
    db
      .select({
        id: tournaments.id,
        published: tournaments.catalogPublished,
      })
      .from(tournaments)
      .where(eq(tournaments.id, input.id))
      .limit(1),
    db
      .select({ id: standings.id })
      .from(standings)
      .where(
        and(
          eq(standings.tournamentId, input.id),
          inArray(standings.id, standingIds)
        )
      ),
  ]);
  if (!currentEvent[0]) throw new Error("Tournament not found.");
  if (validRows.length !== standingIds.length) {
    throw new Error("Import contains a player outside this tournament.");
  }

  const now = new Date().toISOString();
  await db.transaction(async (transaction) => {
    const standingRows = sql.join(
      preview.entrantMappings.map(
        (entrant) =>
          sql`(${entrant.standingId}::bigint, ${entrant.sourcePlayerId}::text)`
      ),
      sql`, `
    );
    await transaction.execute(sql`
      update ${standings} as s
      set source_player_id = updates.source_player_id
      from (values ${standingRows}) as updates(id, source_player_id)
      where s.id = updates.id and s.tournament_id = ${input.id}
    `);

    await transaction
      .insert(tournamentDecklists)
      .values(deckValues)
      .onConflictDoUpdate({
        target: [tournamentDecklists.standingId, tournamentDecklists.side],
        set: {
          sourceKind: sql`excluded.source_kind`,
          sourceUrl: sql`excluded.source_url`,
          nrdbUrl: sql`excluded.nrdb_url`,
          title: sql`excluded.title`,
          identity: sql`excluded.identity`,
          cards: sql`excluded.cards`,
          cardCount: sql`excluded.card_count`,
          influenceTotal: sql`excluded.influence_total`,
          sourceHash: sql`excluded.source_hash`,
          nrdbHash: sql`excluded.nrdb_hash`,
          comparisonStatus: sql`excluded.comparison_status`,
          updatedAt: sql`excluded.updated_at`,
          importedAt: sql`excluded.imported_at`,
          lastVerifiedAt: sql`excluded.last_verified_at`,
        },
      });

    await transaction
      .update(tournaments)
      .set({
        name,
        date,
        location: nullable(input.location),
        region: nullable(input.region),
        format: nullable(input.format),
        cardpool: nullable(input.cardpool),
        url: sourceUrl,
        abrUrl,
        catalogPublished: true,
        catalogPublishedAt: currentEvent[0].published
          ? sql`${tournaments.catalogPublishedAt}`
          : now,
        lastModifiedAt: now,
      })
      .where(eq(tournaments.id, input.id));
  });

  revalidateCatalog(input.id);
  return { ok: true };
}

export async function saveCatalogEvent(input: SaveCatalogEventInput) {
  await requireUser();
  const name = input.name.trim();
  const date = input.date.trim();
  const sourceUrl = validateExternalUrl(nullable(input.sourceUrl), [
    "tournaments.nullsignal.games",
    "www.aesopstables.net",
  ]);
  const abrUrl = validateExternalUrl(nullable(input.abrUrl), [
    "alwaysberunning.net",
  ]);
  const [current] = await db
    .select({
      id: tournaments.id,
      published: tournaments.catalogPublished,
    })
    .from(tournaments)
    .where(eq(tournaments.id, input.id))
    .limit(1);
  if (!current) throw new Error("Tournament not found.");
  if (input.published) {
    if (!name || !date) throw new Error("Published events need a name and date.");
    // Events can be published with top-cut players but no imported Cobra lists
    // (e.g. lists were never made public on Cobra); NRDB links can be added
    // afterwards. Only require that top-cut players exist.
    const [eligibility] = await db.execute<{
      has_players: boolean;
    }>(sql`
      select
        exists (
          select 1 from standings s
          where s.tournament_id = ${input.id} and s.top_cut_rank > 0
        ) as has_players
    `);
    if (!eligibility.has_players) {
      throw new Error("Published events need at least one top-cut player.");
    }
  }

  await db
    .update(tournaments)
    .set({
      name: name || null,
      date: date || null,
      location: nullable(input.location),
      region: nullable(input.region),
      format: nullable(input.format),
      cardpool: nullable(input.cardpool),
      url: sourceUrl,
      abrUrl,
      catalogPublished: input.published,
      catalogPublishedAt: input.published
        ? current.published
          ? sql`${tournaments.catalogPublishedAt}`
          : new Date().toISOString()
        : null,
      lastModifiedAt: new Date().toISOString(),
    })
    .where(eq(tournaments.id, input.id));

  revalidateCatalog(input.id);
  return { ok: true };
}

export async function saveCatalogPlayerLinks(input: SavePlayerLinksInput) {
  await requireUser();
  const validPlayers = await db
    .select({ id: standings.id })
    .from(standings)
    .where(eq(standings.tournamentId, input.tournamentId));
  const validIds = new Set(validPlayers.map((player) => player.id));
  if (input.players.some((player) => !validIds.has(player.standingId))) {
    throw new Error("Player does not belong to this tournament.");
  }

  await db.transaction(async (transaction) => {
    for (const player of input.players) {
      await transaction
        .update(standings)
        .set({ sourcePlayerId: nullable(player.sourcePlayerId) })
        .where(eq(standings.id, player.standingId));
      for (const side of ["corp", "runner"] as const) {
        const rawUrl = side === "corp" ? player.corpNrdbUrl : player.runnerNrdbUrl;
        const nrdbUrl = validateExternalUrl(nullable(rawUrl), [
          "netrunnerdb.com",
          "www.netrunnerdb.com",
        ]);
        if (!nrdbUrl) {
          await transaction
            .update(tournamentDecklists)
            .set({ nrdbUrl: null, updatedAt: new Date().toISOString() })
            .where(
              and(
                eq(tournamentDecklists.standingId, player.standingId),
                eq(tournamentDecklists.side, side)
              )
            );
          continue;
        }
        await transaction
          .insert(tournamentDecklists)
          .values({
            standingId: player.standingId,
            side,
            sourceKind: "manual",
            nrdbUrl,
          })
          .onConflictDoUpdate({
            target: [tournamentDecklists.standingId, tournamentDecklists.side],
            set: { nrdbUrl, updatedAt: new Date().toISOString() },
          });
      }
    }
  });
  revalidateCatalog(input.tournamentId);
  return { ok: true };
}

export async function removeCatalogNrdbLink(input: {
  tournamentId: number;
  standingId: number;
  side: DeckSide;
}) {
  await requireUser();
  const [player] = await db
    .select({ id: standings.id })
    .from(standings)
    .where(
      and(
        eq(standings.id, input.standingId),
        eq(standings.tournamentId, input.tournamentId)
      )
    )
    .limit(1);
  if (!player) throw new Error("Player does not belong to this tournament.");

  await db
    .update(tournamentDecklists)
    .set({
      nrdbUrl: null,
      nrdbHash: null,
      comparisonStatus: "unverified",
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(tournamentDecklists.standingId, input.standingId),
        eq(tournamentDecklists.side, input.side)
      )
    );

  revalidateCatalog(input.tournamentId);
  return { ok: true };
}
