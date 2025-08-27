"use server";

import { NrdbCardResponse, NrdbDecklistResponse } from "@/lib/nrdb";
import { getArchetype, NRDB_URL } from "@/lib/util";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/src/utils/drizzle/client";
import {
  matches,
  standings,
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
import { alias } from "drizzle-orm/pg-core";

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
  identity: string | null;
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
      runner_wins:
        sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`.mapWith(
          Number
        ),
      corp_wins:
        sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`.mapWith(
          Number
        ),
      draws:
        sql<number>`count(*) filter (where ${matchesMapped.result} = 'draw')`.mapWith(
          Number
        ),
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
      runner_wins:
        sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`.mapWith(
          Number
        ),
      corp_wins:
        sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`.mapWith(
          Number
        ),
      draws:
        sql<number>`count(*) filter (where ${matchesMapped.result} = 'draw')`.mapWith(
          Number
        ),
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
          ? sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`.mapWith(
              Number
            )
          : sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`.mapWith(
              Number
            ),
      total_losses:
        side === "corp"
          ? sql<number>`count(*) filter (where ${matchesMapped.result} = 'runnerWin')`.mapWith(
              Number
            )
          : sql<number>`count(*) filter (where ${matchesMapped.result} = 'corpWin')`.mapWith(
              Number
            ),
      total_draws:
        sql<number>`count(*) filter (where ${matchesMapped.result} = 'draw')`.mapWith(
          Number
        ),
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
  const whereConditions = [];

  // Ensure both identity columns are not null
  whereConditions.push(isNotNull(standingsMapped.corpShortId));
  whereConditions.push(isNotNull(standingsMapped.runnerShortId));

  // Filter out players with no games
  if (side === "corp") {
    // For runner_id_corp_performance: ensure corp games exist
    whereConditions.push(
      sql`${standingsMapped.corpWins} + ${standingsMapped.corpLosses} > 0`
    );
  } else {
    // For corp_id_runner_performance: ensure runner games exist
    whereConditions.push(
      sql`${standingsMapped.runnerWins} + ${standingsMapped.runnerLosses} > 0`
    );
  }

  // Tournament filter
  if (tournamentIds.length > 0) {
    whereConditions.push(inArray(standingsMapped.tournamentId, tournamentIds));
  }

  // Determine which identity to group by and which wins/losses to sum
  const groupByColumn =
    side === "corp"
      ? standingsMapped.runnerShortId // When looking at corp performance, group by runner
      : standingsMapped.corpShortId; // When looking at runner performance, group by corp

  const result = await db
    .select({
      id: groupByColumn,
      total_wins:
        side === "corp"
          ? sql<number>`sum(${standingsMapped.corpWins})`.mapWith(Number)
          : sql<number>`sum(${standingsMapped.runnerWins})`.mapWith(Number),
      total_losses:
        side === "corp"
          ? sql<number>`sum(${standingsMapped.corpLosses})`.mapWith(Number)
          : sql<number>`sum(${standingsMapped.runnerLosses})`.mapWith(Number),
      total_games:
        side === "corp"
          ? sql<number>`sum(${standingsMapped.corpWins} + ${standingsMapped.corpLosses})`.mapWith(
              Number
            )
          : sql<number>`sum(${standingsMapped.runnerWins} + ${standingsMapped.runnerLosses})`.mapWith(
              Number
            ),
      distinct_players: count(),
    })
    .from(standingsMapped)
    .innerJoin(tournaments, eq(standingsMapped.tournamentId, tournaments.id))
    .where(and(...whereConditions))
    .groupBy(groupByColumn);

  // Map results and calculate win rate in JavaScript
  const mappedResults = result.map((row) => {
    const totalGames = row.total_games;
    const totalWins = row.total_wins;
    const totalLosses = row.total_losses;

    const winRate =
      totalGames > 0 ? Number((totalWins / totalGames).toFixed(3)) : 0;

    return {
      id: row.id ?? "",
      total_games: totalGames,
      total_wins: totalWins,
      total_losses: totalLosses,
      total_draws: 0, // No draws in standings data
      win_rate: winRate,
    };
  });

  // Sort by win rate (desc for runner performance, asc for corp performance per SQL)
  return side === "corp"
    ? mappedResults.sort((a, b) => a.win_rate - b.win_rate) // Ascending for corp
    : mappedResults.sort((a, b) => b.win_rate - a.win_rate); // Descending for runner
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
  const whereConditions = [];

  // Tournament filter
  if (tournamentFilter.length > 0) {
    whereConditions.push(
      inArray(standingsMapped.tournamentId, tournamentFilter)
    );
  }

  // Phase filter based on SQL function logic:
  // (include_swiss) or (include_cut and top_cut_rank != 0)
  const phaseConditions = [];
  if (includeSwiss) {
    phaseConditions.push(sql`true`); // Include all players
  }
  if (includeCut && !includeSwiss) {
    // Only add cut condition if swiss is not included (to avoid redundancy)
    phaseConditions.push(ne(standingsMapped.topCutRank, 0));
  }

  if (phaseConditions.length > 0) {
    whereConditions.push(or(...phaseConditions));
  }

  // Select the appropriate identity column based on side
  const identityColumn =
    side === "runner"
      ? standingsMapped.runnerShortId
      : standingsMapped.corpShortId;

  const result = await db
    .select({
      identity: identityColumn,
      player_count: count(),
    })
    .from(standingsMapped)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(identityColumn)
    .orderBy(desc(count()));

  return result.map((row) => ({
    identity: row.identity,
    player_count: row.player_count,
  }));
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
  const whereConditions = [];

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

  const result = await db
    .select({
      total_games: count(),
      corp_wins:
        sql<number>`sum(case when ${matchesMapped.result} = 'corpWin' then 1 else 0 end)`.mapWith(
          Number
        ),
      runner_wins:
        sql<number>`sum(case when ${matchesMapped.result} = 'runnerWin' then 1 else 0 end)`.mapWith(
          Number
        ),
      draws:
        sql<number>`sum(case when ${matchesMapped.result} = 'draw' then 1 else 0 end)`.mapWith(
          Number
        ),
      byes: sql<number>`sum(case when ${matchesMapped.result} = 'bye' then 1 else 0 end)`.mapWith(
        Number
      ),
      unknowns:
        sql<number>`sum(case when ${matchesMapped.result} not in ('corpWin', 'runnerWin', 'draw', 'bye') or ${matchesMapped.result} is null then 1 else 0 end)`.mapWith(
          Number
        ),
    })
    .from(matchesMapped)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  // The query always returns exactly one row with aggregated results
  const row = result[0];

  return {
    total_games: row.total_games,
    corp_wins: row.corp_wins,
    runner_wins: row.runner_wins,
    draws: row.draws,
    byes: row.byes,
    unknowns: row.unknowns,
  };
}

export async function getMatchesByIdentity(
  runner_id: string,
  corp_id: string,
  tournamentFilter?: number[],
  include_cut: boolean = true,
  include_swiss: boolean = true
): Promise<MatchesByIdentity[]> {
  const whereConditions = [];

  // Required filters for specific identities
  whereConditions.push(eq(matchesMapped.runnerShortId, runner_id));
  whereConditions.push(eq(matchesMapped.corpShortId, corp_id));

  // Tournament filter
  if (tournamentFilter && tournamentFilter.length > 0) {
    whereConditions.push(inArray(matchesMapped.tournamentId, tournamentFilter));
  }

  // Phase filter
  const phase_filter =
    include_cut && !include_swiss
      ? "cut"
      : !include_cut && include_swiss
      ? "swiss"
      : null;

  if (phase_filter) {
    whereConditions.push(eq(matchesMapped.phase, phase_filter));
  }

  // Create aliases for the standings table to avoid conflicts
  const runnerStandings = alias(standings, "runner_standings");
  const corpStandings = alias(standings, "corp_standings");

  const result = await db
    .select({
      tournament_id: matchesMapped.tournamentId,
      tournament_name: tournaments.name,
      tournament_url: tournaments.url,
      tournament_date: tournaments.date,
      round: matchesMapped.round,
      round_table: matchesMapped.table,
      phase: matchesMapped.phase,
      corp_player_name: corpStandings.name,
      runner_player_name: runnerStandings.name,
      corp_id: matchesMapped.corpShortId,
      runner_id: matchesMapped.runnerShortId,
      result: matchesMapped.result,
    })
    .from(matchesMapped)
    .leftJoin(tournaments, eq(matchesMapped.tournamentId, tournaments.id))
    .leftJoin(runnerStandings, eq(matchesMapped.runnerId, runnerStandings.id))
    .leftJoin(corpStandings, eq(matchesMapped.corpId, corpStandings.id))
    .where(and(...whereConditions))
    .orderBy(
      desc(tournaments.date),
      matchesMapped.tournamentId,
      matchesMapped.round
    );

  return result.map((row) => ({
    tournament_id: row.tournament_id || 0,
    tournament_name: row.tournament_name || "",
    tournament_url: row.tournament_url || "",
    tournament_date: row.tournament_date || "",
    round: row.round || 0,
    round_table: row.round_table || 0,
    phase: row.phase || "",
    corp_player_name: row.corp_player_name || "",
    runner_player_name: row.runner_player_name || "",
    corp_id: row.corp_id || "",
    runner_id: row.runner_id || "",
    result: row.result || "",
  }));
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

export async function getPlayerIdPerformance({
  targetId,
  tournamentFilter = [],
}: {
  targetId: string;
  tournamentFilter?: number[];
}) {
  // Build the where conditions
  const whereConditions = [
    or(
      eq(standingsMapped.corpShortId, targetId),
      eq(standingsMapped.runnerShortId, targetId)
    ),
  ];

  if (tournamentFilter.length > 0) {
    whereConditions.push(
      inArray(standingsMapped.tournamentId, tournamentFilter)
    );
  }

  // Query the database
  const results = await db
    .select({
      playerId: standingsMapped.id,
      playerName: standingsMapped.name,
      tournamentId: standingsMapped.tournamentId,
      tournamentName: tournaments.name,
      corpShortId: standingsMapped.corpShortId,
      runnerShortId: standingsMapped.runnerShortId,
      corpWins: standingsMapped.corpWins,
      corpLosses: standingsMapped.corpLosses,
      runnerWins: standingsMapped.runnerWins,
      runnerLosses: standingsMapped.runnerLosses,
    })
    .from(standingsMapped)
    .leftJoin(tournaments, eq(standingsMapped.tournamentId, tournaments.id))
    .where(and(...whereConditions))
    .orderBy(standingsMapped.tournamentId, standingsMapped.name);

  // Transform the results to match the expected output format
  const transformedResults = results.map((row) => {
    const isCorpSide = row.corpShortId === targetId;
    const side = isCorpSide ? "corp" : "runner";

    // Calculate wins/losses for the side that played the target ID
    const swissWins = isCorpSide ? row.corpWins || 0 : row.runnerWins || 0;
    const swissLosses = isCorpSide
      ? row.corpLosses || 0
      : row.runnerLosses || 0;
    const swissTotal = swissWins + swissLosses;
    const swissWinrate =
      swissTotal > 0
        ? Math.round((swissWins / swissTotal) * 1000) / 1000
        : null;

    // Calculate wins/losses for the opposite side
    const oppositeWins = isCorpSide ? row.runnerWins || 0 : row.corpWins || 0;
    const oppositeLosses = isCorpSide
      ? row.runnerLosses || 0
      : row.corpLosses || 0;
    const oppositeTotal = oppositeWins + oppositeLosses;
    const oppositeWinrate =
      oppositeTotal > 0
        ? Math.round((oppositeWins / oppositeTotal) * 1000) / 1000
        : null;

    return {
      playerId: row.playerId!,
      playerName: row.playerName!,
      tournamentId: row.tournamentId!,
      tournamentName: row.tournamentName,
      side,
      idPlayed: targetId,
      swissWins,
      swissLosses,
      swissTotal,
      swissWinrate,
      oppositeWins,
      oppositeLosses,
      oppositeTotal,
      oppositeWinrate,
    };
  });

  return transformedResults;
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
