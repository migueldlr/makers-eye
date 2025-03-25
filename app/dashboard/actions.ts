"use server";

import { StandingResult } from "@/lib/localtypes";
import { Database } from "@/lib/supabase";
import { Tournament } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export async function uploadTournament(tournament: Tournament, url: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name: tournament.name,
      url,
      meta: "24.12",
      last_modified_at: new Date(),
    })
    .select();
  if (error) {
    throw new Error(error.message);
  }
  return data[0].id;
}

export async function uploadStandings(
  tournamentId: number,
  standings: Omit<StandingResult, "tournament">[]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("standings")
    .insert(
      standings.map((standing) => {
        const out: Database["public"]["Tables"]["standings"]["Insert"] = {
          tournament_id: tournamentId,
          name: standing.name,
          swiss_rank: standing.swissRank,
          sos: standing.strengthOfSchedule,
          e_sos: standing.extendedStrengthOfSchedule,
          match_points: standing.matchPoints,
          corp_wins: standing.corpWins,
          corp_losses: standing.corpLosses,
          corp_draws: standing.corpDraws,
          runner_wins: standing.runnerWins,
          runner_losses: standing.runnerLosses,
          runner_draws: standing.runnerDraws,
          corp_identity: standing.corpIdentity,
          runner_identity: standing.runnerIdentity,
          top_cut_rank: standing.topCutRank,
        };
        return out;
      })
    )
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function proxyFetch(url: string) {
  console.log(url);
  const res = await fetch(url);
  console.log(res);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return await res.json();
}

export async function doesTournamentExist(name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("tournaments").select("name");

  if (error) {
    throw new Error(error.message);
  }
  return data.some((tournament) => tournament.name === name);
}
