"use server";

import { RawMatch, StandingResult, TournamentRow } from "@/lib/localtypes";
import { detectAbrTournament } from "@/lib/abr";
import { Database } from "@/lib/supabase";
import { Tournament } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export async function uploadTournament(
  tournament: Tournament,
  url: string,
  meta: string,
  region: string | null,
  location: string | null,
  abrUrl: string,
  cardpool: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name: tournament.name,
      url,
      last_modified_at: new Date(),
      date: tournament.date,
      meta,
      region,
      location,
      abr_url: abrUrl,
      cardpool,
    })
    .select();
  if (error) {
    throw new Error(error.message);
  }
  return data[0].id;
}

export async function uploadStandings(
  tournamentId: number,
  standings: Omit<StandingResult, "tournament">[],
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
          source_player_id: standing.sourcePlayerId,
        };
        return out;
      }),
    )
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function uploadMatches(tournamentId: number, matches: RawMatch[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .insert(
      matches.map((match) => {
        const out: Database["public"]["Tables"]["matches"]["Insert"] = {
          ...match,
          tournament_id: tournamentId,
        };
        return out;
      }),
    )
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function proxyFetch(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return await res.json();
}

export async function detectAbrUrl(tournament: Tournament) {
  if (!tournament.name || !tournament.date) return null;
  const result = await detectAbrTournament({
    name: tournament.name,
    date: tournament.date,
    city: tournament.city,
    country: tournament.country,
    playerCount: tournament.players?.length,
    cutSize: tournament.cutToTop,
  });
  return result.status === "matched" ? result.tournament?.url ?? null : null;
}

export async function doesTournamentExist(name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("tournaments").select("name");

  if (error) {
    throw new Error(error.message);
  }
  return data.some((tournament) => tournament.name === name);
}

export async function getTournaments(): Promise<TournamentRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("tournaments").select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
