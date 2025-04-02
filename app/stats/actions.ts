"use server";

import { createClient } from "@/utils/supabase/server";

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
  tournamentFilter?: number[];
}): Promise<WinrateData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_head_to_head_winrates", {
      min_matches: minMatches,
      include_swiss: includeSwiss,
      include_cut: includeCut,
      tournament_filter: tournamentFilter,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
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
  const supabase = await createClient();

  const { data: runnerData, error: runnerError } = await supabase
    .rpc("get_runner_popularity", {
      tournament_filter: tournamentFilter,
      include_swiss: includeSwiss,
      include_cut: includeCut,
    })
    .select();

  if (runnerError) {
    throw new Error("Error fetching runner info", runnerError);
  }

  const { data: corpData, error: corpError } = await supabase
    .rpc("get_corp_popularity", {
      tournament_filter: tournamentFilter,
      include_swiss: includeSwiss,
      include_cut: includeCut,
    })
    .select();

  if (corpError) {
    throw new Error("Error fetching corp info", corpError);
  }

  return {
    runnerData,
    corpData,
  };
}

export async function getSummaryStats(tournamentFilter?: number[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_summary_stats", { tournament_filter: tournamentFilter ?? null })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data[0];
}

export async function getTournaments() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tournaments").select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getSideWinrates(
  ids: string[],
  tournamentFilter?: number[],
  side: "corp" | "runner" = "corp"
): Promise<WinrateData[]> {
  const supabase = await createClient();

  const rpcMethod =
    side === "corp" ? "get_corp_winrates" : "get_runner_winrates";
  const idFilter = side === "corp" ? "corp_filter" : "runner_filter";

  const { data, error } = await supabase
    .rpc(rpcMethod, {
      [idFilter]: ids,
      tournament_filter: tournamentFilter ?? null,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    side === "corp"
      ? "get_corp_identity_winrates"
      : "get_runner_identity_winrates",
    {
      tournament_filter: tournamentIds,
      include_swiss: includeSwiss,
      include_cut: includeCut,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
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

export async function getPopularity(
  tournamentFilter: number[] = [],
  side: "runner" | "corp"
): Promise<PopularityData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc(side === "runner" ? "get_runner_popularity" : "get_corp_popularity", {
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

export async function getGameResults(
  tournamentFilter?: number[]
): Promise<GameResults> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_tournament_game_outcomes", {
      tournament_filter: tournamentFilter ?? null,
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
