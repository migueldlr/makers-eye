"use server";

import { NrdbCardResponse, NrdbDecklistResponse } from "@/lib/nrdb";
import { getArchetype, NRDB_URL } from "@/lib/util";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/src/utils/drizzle/client";
import {
  matches,
  standingsMapped,
  tournaments,
  matchesMapped,
} from "@/src/db/schema";
import {
  count,
  countDistinct,
  inArray,
  max,
  min,
  sql,
  and,
  or,
  eq,
  desc,
  ne,
  isNotNull,
} from "drizzle-orm";

export type WinrateData = {
  runner_id: string;
  corp_id: string;
  total_games: number;
  runner_wins: number;
  corp_wins: number;
  draws: number;
};

export type IdentityWinrateData = {
  id: string;
  total_games: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  win_rate: number;
};

export type MatchesByIdentity = {
  tournament_id: number;
  tournament_name: string;
  tournament_url: string;
  tournament_date: string;
  round: number;
  round_table: number;
  phase: string;
  corp_player_name: string;
  runner_player_name: string;
  corp_id: string;
  runner_id: string;
  result: string;
};

export type GameResults = {
  total_games: number;
  runner_wins: number;
  corp_wins: number;
  draws: number;
  byes: number;
  unknowns: number;
};

export type PopularityData = {
  identity: string;
  player_count: number;
};

export async function getWinrates({
  minMatches,
  includeSwiss,
  includeCut,
  tournamentFilter,
}: {
  minMatches: number;
  includeSwiss: boolean;
  includeCut: boolean;
  tournamentFilter: number[];
}): Promise<WinrateData[]> {
  const whereConditions = [];

  if (tournamentFilter.length > 0) {
    whereConditions.push(inArray(matchesMapped.tournamentId, tournamentFilter));
  }

  const phaseConditions = [];
  if (includeSwiss) {
    phaseConditions.push(eq(matchesMapped.phase, "swiss"));
  }
  if (includeCut) {
    phaseConditions.push(eq(matchesMapped.phase, "cut"));
  }

  if (phaseConditions.length > 0) {
    whereConditions.push(or(...phaseConditions));
  }

  const result = await db
    .select({
      runner_id: matchesMapped.runnerShortId,
      corp_id: matchesMapped.corpShortId,
      runner_wins: sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`,
      corp_wins: sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`,
      draws: sql<number>`count(*) filter (where ${matchesMapped.result} = 'draw')`,
      total_games: count(),
    })
    .from(matchesMapped)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(matchesMapped.runnerShortId, matchesMapped.corpShortId)
    .having(sql`count(*) >= ${minMatches}`)
    .orderBy(desc(count()));

  return result.map((row) => ({
    runner_id: row.runner_id ?? "",
    corp_id: row.corp_id ?? "",
    runner_wins: row.runner_wins,
    corp_wins: row.corp_wins,
    draws: row.draws,
    total_games: row.total_games,
  }));
}

export async function getStandings(): Promise<{}[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("standings").select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getMatchesMetadata({
  includeSwiss,
  includeCut,
  tournamentFilter,
}: {
  includeSwiss: boolean;
  includeCut: boolean;
  tournamentFilter?: number[];
}): Promise<{
  runnerData: { identity: string; player_count: number }[];
  corpData: { identity: string; player_count: number }[];
}> {
  const whereConditions = [];

  if (tournamentFilter && tournamentFilter.length > 0) {
    whereConditions.push(
      inArray(standingsMapped.tournamentId, tournamentFilter)
    );
  }

  const phaseConditions = [];
  if (includeSwiss) {
    phaseConditions.push(sql`true`);
  }
  if (includeCut) {
    phaseConditions.push(ne(standingsMapped.topCutRank, 0));
  }

  if (phaseConditions.length > 0) {
    whereConditions.push(or(...phaseConditions));
  }

  const runnerData = await db
    .select({
      identity: standingsMapped.runnerShortId,
      player_count: count(),
    })
    .from(standingsMapped)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(standingsMapped.runnerShortId)
    .orderBy(desc(count()));

  const corpData = await db
    .select({
      identity: standingsMapped.corpShortId,
      player_count: count(),
    })
    .from(standingsMapped)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(standingsMapped.corpShortId)
    .orderBy(desc(count()));

  return {
    runnerData: runnerData.map((row) => ({
      identity: row.identity ?? "",
      player_count: row.player_count,
    })),
    corpData: corpData.map((row) => ({
      identity: row.identity ?? "",
      player_count: row.player_count,
    })),
  };
}

export async function getSummaryStats(tournamentIds: number[]) {
  const matchesAgg = await db
    .select({ count: count() })
    .from(matches)
    .where(inArray(matches.tournamentId, tournamentIds));

  const playersAgg = await db
    .select({ count: countDistinct(standingsMapped.name) })
    .from(standingsMapped)
    .where(inArray(standingsMapped.tournamentId, tournamentIds));

  const tournamentsAgg = await db
    .select({
      count: count(),
      earliest: min(tournaments.date),
      latest: max(tournaments.date),
    })
    .from(tournaments)
    .where(inArray(tournaments.id, tournamentIds));

  return {
    total_matches: matchesAgg[0].count,
    total_players: playersAgg[0].count,
    total_tournaments: tournamentsAgg[0].count,
    earliest_tournament: tournamentsAgg[0].earliest ?? "",
    latest_tournament: tournamentsAgg[0].latest ?? "",
  };
}

export async function getTournaments() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tournaments").select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getSideWinrates({
  ids,
  tournamentFilter,
  side = "corp",
  includeCut = true,
  includeSwiss = true,
}: {
  ids: string[];
  tournamentFilter?: number[];
  side: "corp" | "runner";
  includeCut: boolean;
  includeSwiss: boolean;
}): Promise<WinrateData[]> {
  const whereConditions = [];

  // Null checks for both identity columns
  whereConditions.push(isNotNull(matchesMapped.corpShortId));
  whereConditions.push(isNotNull(matchesMapped.runnerShortId));

  // Filter by specific identities
  if (ids.length > 0) {
    if (side === "corp") {
      whereConditions.push(inArray(matchesMapped.corpShortId, ids));
    } else {
      whereConditions.push(inArray(matchesMapped.runnerShortId, ids));
    }
  }

  // Tournament filter
  if (tournamentFilter && tournamentFilter.length > 0) {
    whereConditions.push(inArray(matchesMapped.tournamentId, tournamentFilter));
  }

  // Phase filter
  const phaseConditions = [];
  if (includeSwiss) {
    phaseConditions.push(eq(matchesMapped.phase, "swiss"));
  }
  if (includeCut) {
    phaseConditions.push(eq(matchesMapped.phase, "cut"));
  }

  if (phaseConditions.length > 0) {
    whereConditions.push(or(...phaseConditions));
  }

  // Query without win rate calculation
  const result = await db
    .select({
      runner_id: matchesMapped.runnerShortId,
      corp_id: matchesMapped.corpShortId,
      runner_wins: sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`,
      corp_wins: sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`,
      draws: sql<number>`count(*) filter (where ${matchesMapped.result} = 'draw')`,
      total_games: count(),
    })
    .from(matchesMapped)
    .where(and(...whereConditions))
    .groupBy(matchesMapped.corpShortId, matchesMapped.runnerShortId);

  // Map results and calculate win rate in JavaScript
  const mappedResults = result.map((row) => {
    const runnerWins = row.runner_wins;
    const corpWins = row.corp_wins;
    const totalGames = row.total_games;

    // Calculate win rate as percentage with 2 decimal places
    const winRate =
      side === "corp"
        ? totalGames > 0
          ? Number(((corpWins / totalGames) * 100).toFixed(2))
          : 0
        : totalGames > 0
        ? Number(((runnerWins / totalGames) * 100).toFixed(2))
        : 0;

    return {
      runner_id: row.runner_id ?? "",
      corp_id: row.corp_id ?? "",
      runner_wins: runnerWins,
      corp_wins: corpWins,
      draws: row.draws,
      total_games: totalGames,
      win_rate: winRate,
    };
  });

  // Sort by win rate in descending order
  return mappedResults.sort((a, b) => b.win_rate - a.win_rate);
}

export async function getIdentityWinrates({
  tournamentIds,
  side,
  includeCut = true,
  includeSwiss = true,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
  includeCut?: boolean;
  includeSwiss?: boolean;
}): Promise<IdentityWinrateData[]> {
  const whereConditions = [];

  // Null check for the identity column
  if (side === "corp") {
    whereConditions.push(isNotNull(matchesMapped.corpShortId));
  } else {
    whereConditions.push(isNotNull(matchesMapped.runnerShortId));
  }

  // Tournament filter
  if (tournamentIds.length > 0) {
    whereConditions.push(inArray(matchesMapped.tournamentId, tournamentIds));
  }

  // Phase filter
  const phaseConditions = [];
  if (includeSwiss) {
    phaseConditions.push(eq(matchesMapped.phase, "swiss"));
  }
  if (includeCut) {
    phaseConditions.push(eq(matchesMapped.phase, "cut"));
  }

  if (phaseConditions.length > 0) {
    whereConditions.push(or(...phaseConditions));
  }

  // Query with dynamic selection and grouping based on side
  const identityColumn =
    side === "corp" ? matchesMapped.corpShortId : matchesMapped.runnerShortId;

  const result = await db
    .select({
      id: identityColumn,
      total_games: count(),
      total_wins:
        side === "corp"
          ? sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`
          : sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`,
      total_losses:
        side === "corp"
          ? sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`
          : sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`,
      total_draws: sql<number>`count(*) filter (where ${matchesMapped.result} = 'draw')`,
    })
    .from(matchesMapped)
    .where(and(...whereConditions))
    .groupBy(identityColumn);

  // Map results and calculate win rate in JavaScript
  const mappedResults = result.map((row) => {
    const totalGames = row.total_games;
    const totalWins = row.total_wins;
    const totalLosses = row.total_losses;
    const totalDraws = row.total_draws;

    // Calculate win rate as percentage with 2 decimal places
    const winRate =
      totalGames > 0 ? Number(((totalWins / totalGames) * 100).toFixed(2)) : 0;

    return {
      id: row.id ?? "",
      total_games: totalGames,
      total_wins: totalWins,
      total_losses: totalLosses,
      total_draws: totalDraws,
      win_rate: winRate,
    };
  });

  // Sort by win rate in descending order
  return mappedResults.sort((a, b) => b.win_rate - a.win_rate);
}

export async function getPartnerIdentityWinrates({
  tournamentIds,
  side,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
}): Promise<IdentityWinrateData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    side === "corp"
      ? "get_runner_id_corp_performance"
      : "get_corp_id_runner_performance",
    {
      tournament_filter: tournamentIds,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCutVsSwiss({
  tournamentIds,
  side,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
}) {
  const supabase = await createClient();
}

export async function getCorpPopularity(
  tournamentFilter?: number[]
): Promise<PopularityData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_corp_popularity", {
      tournament_filter: tournamentFilter ?? null,
      include_swiss: true,
      include_cut: true,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPopularity({
  tournamentFilter = [],
  side,
  includeSwiss = true,
  includeCut = true,
}: {
  tournamentFilter: number[];
  side: "runner" | "corp";
  includeSwiss?: boolean;
  includeCut?: boolean;
}): Promise<PopularityData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc(side === "runner" ? "get_runner_popularity" : "get_corp_popularity", {
      tournament_filter: tournamentFilter ?? null,
      include_swiss: includeSwiss,
      include_cut: includeCut,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getGameResults({
  tournamentFilter,
  includeCut,
  includeSwiss,
}: {
  tournamentFilter?: number[];
  includeCut: boolean;
  includeSwiss: boolean;
}): Promise<GameResults> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_tournament_game_outcomes", {
      tournament_filter: tournamentFilter ?? null,
      include_swiss: includeSwiss,
      include_cut: includeCut,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data[0];
}

export async function getMatchesByIdentity(
  runner_id: string,
  corp_id: string,
  tournamentFilter?: number[],
  include_cut: boolean = true,
  include_swiss: boolean = true
): Promise<MatchesByIdentity[]> {
  const supabase = await createClient();
  const phase_filter =
    include_cut && !include_swiss
      ? "cut"
      : !include_cut && include_swiss
      ? "swiss"
      : null;
  const { data, error } = await supabase
    .rpc("get_matches_by_id", {
      corp_filter: corp_id,
      runner_filter: runner_id,
      tournament_filter: tournamentFilter ?? null,
      phase_filter,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateAbrUrls({
  runnerDeckId,
  corpDeckId,
  tournamentId,
  name,
}: {
  runnerDeckId: number;
  corpDeckId: number;
  tournamentId: number;
  name: string;
}) {
  const supabase = await createClient();

  // const { data, error, status } = await supabase
  //   .from("standings")
  //   .select()
  //   .eq("tournament_id", tournamentId)
  //   .eq("name", name);

  const { data, error, status } = await supabase
    .from("standings")
    .update({
      runner_deck_id: runnerDeckId,
      corp_deck_id: corpDeckId,
    })
    .eq("tournament_id", tournamentId)
    .eq("name", name)
    .select();

  console.log(status);
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDecklist({ decklistId }: { decklistId: number }) {
  const res = await fetch(`${NRDB_URL}/decklist/${decklistId}`);
  const decklistResponse: NrdbDecklistResponse = await res.json();
  const decklist = decklistResponse.data[0];
  const cards = decklist.cards;

  // console.log(decklistId);
  // console.log(decklistResponse);

  // const cards = await getCardNames({ decklist });

  console.log(cards);

  return cards;
}

export async function uploadDecklist({ decklistId }: { decklistId: number }) {
  const supabase = await createClient();

  const { data: data1, error: error1 } = await supabase
    .from("decklists")
    .select()
    .eq("id", decklistId);
  if (error1) {
    throw new Error(error1.message);
  }
  const alreadyExists = data1.length > 0;
  if (alreadyExists) {
    console.log("Decklist already exists in supabase");
    return;
  }

  const cards = await getDecklist({ decklistId });

  const { data, error } = await supabase
    .from("decklists")
    .insert({
      id: decklistId,
      cards,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadAllDecklists() {
  const supabase = await createClient();

  const { data: decklistIdData, error } = await supabase
    .rpc("get_all_decklist_ids")
    .select();

  if (error) {
    throw new Error(error.message);
  }

  const decklistIds = decklistIdData.map((decklistId: { deck_id: number }) => {
    return decklistId.deck_id;
  });

  const decklists = await Promise.all(
    decklistIds.map(async (decklistId: number) => {
      const decklist = await uploadDecklist({ decklistId });
      return decklist;
    })
  );

  console.log("done!");

  return decklists;
}

export async function uploadAllCards() {
  const supabase = await createClient();

  const { data: decklistsResponse, error } = await supabase
    .from("decklists")
    .select();

  if (error) {
    throw new Error(error.message);
  }

  // console.log(decklistsResponse);
  const cards = decklistsResponse
    .flatMap((decklist: { cards: { [key: string]: number } }) => {
      const { cards } = decklist;

      const cardIds = Object.keys(cards);

      // if (cardIds.some((cardId) => cardId[0] === "0")) {
      //   console.log(cardIds);
      // }
      return cardIds;
    })
    .map((card) => Number(card));

  const uniqueCards = Array.from(new Set(cards));

  console.log(uniqueCards.length);

  // fetchAllCards({ cardIds: uniqueCards });

  await Promise.all(
    uniqueCards.map(async (cardId) => {
      await uploadCard({ cardId });
    })
  );

  return uniqueCards;
}

export async function uploadCard({ cardId }: { cardId: number }) {
  // console.log("uploading card", cardId);
  const supabase = await createClient();

  const { data: data1, error: error1 } = await supabase
    .from("cards")
    .select()
    .eq("id", cardId);
  if (error1) {
    throw new Error(error1.message);
  }
  const alreadyExists = data1.length > 0;
  if (alreadyExists) {
    console.log(`Card ID ${cardId} already exists in supabase`);
    return;
  }

  console.log(`fetching card ${cardId}`);

  const cardIdPadded = String(cardId).padStart(5, "0");

  const res = await fetch(`${NRDB_URL}/card/${cardIdPadded}`);
  const cardResponse: NrdbCardResponse = await res.json();
  const card = cardResponse.data[0];

  console.log(`fetched ${card.title}`);

  const { data, error } = await supabase
    .from("cards")
    .insert({
      id: cardId,
      name: card.title,
      type: card.type_code,
    })
    .select();
  if (error) {
    throw new Error(error.message);
  }
  console.log(`uploaded ${card.title}`);

  return data;
}

export async function saveAllCards() {
  const supabase = await createClient();
}

export async function refreshAllArchetypes() {
  const supabase = await createClient();

  const { data: decklists, error } = await supabase.from("decklists").select();

  if (error) {
    throw new Error(error.message);
  }
  const { data: cards, error: error2 } = await supabase.from("cards").select();

  if (error2) {
    throw new Error(error2.message);
  }

  const cardsById: {
    [id: string]: {
      id: number;
      name: string;
      type: string;
    };
  } = cards.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {});

  const dataToUpload = decklists.map(
    (decklist: { id: number; cards: { [k: number]: number } }) => {
      const data = Object.entries(decklist.cards).map(([cardId, count]) => {
        const card = cardsById[Number(cardId)];
        if (card === undefined) {
          console.log(cardId);
          throw new Error("Card not found");
        }
        return {
          card_name: card.name,
          card_type: card.type,
          card_count: count,
        };
      });
      const archetype = getArchetype(data);
      return {
        id: decklist.id,
        archetype,
      };
    }
  );

  const { data, error: error3 } = await supabase
    .from("decklists")
    .upsert(dataToUpload);
  if (error3) {
    throw new Error(error3.message);
  }
  console.log(data);
  return data;
}
