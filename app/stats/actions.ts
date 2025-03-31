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

export type PopularityData = {
  identity: string;
  player_count: number;
};

export async function getWinrates({
  minMatches,
  includeSwiss,
  includeCut,
}: {
  minMatches: number;
  includeSwiss: boolean;
  includeCut: boolean;
}): Promise<WinrateData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_head_to_head_winrates", {
      min_matches: minMatches,
      include_swiss: includeSwiss,
      include_cut: includeCut,
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
}: {
  includeSwiss: boolean;
  includeCut: boolean;
}): Promise<{
  runnerData: { identity: string; player_count: number }[];
  corpData: { identity: string; player_count: number }[];
}> {
  const supabase = await createClient();

  const { data: runnerData, error: runnerError } = await supabase
    .rpc("get_runner_popularity", {
      tournament_filter: null,
      include_swiss: includeSwiss,
      include_cut: includeCut,
    })
    .select();

  if (runnerError) {
    throw new Error("Error fetching runner info", runnerError);
  }

  const { data: corpData, error: corpError } = await supabase
    .rpc("get_corp_popularity", {
      tournament_filter: null,
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

export async function getCorpWinrates(corps: string[]): Promise<WinrateData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_corp_winrates", {
      corp_filter: corps,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCorpPopularity(
  tournamentFilter?: number[]
): Promise<PopularityData[]> {
  const supabase = await createClient();
  console.log(tournamentFilter);

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
