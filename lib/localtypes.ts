import { Database } from "./supabase";

export type StandingResult = {
  tournament: number;
  topCutRank?: number;
  swissRank: number;
  name: string;
  corpIdentity: string;
  runnerIdentity: string;
  corpWins: number;
  corpLosses: number;
  corpDraws: number;
  runnerWins: number;
  runnerLosses: number;
  runnerDraws: number;
  matchPoints: number;
  strengthOfSchedule: number;
  extendedStrengthOfSchedule: number;
};

export type Match = Database["public"]["Tables"]["matches"]["Insert"];
export type RawMatch = Omit<Match, "created_at" | "id" | "tournament_id">;
export type Standing = Database["public"]["Tables"]["standings"]["Row"];
export type TournamentRow =
  Database["public"]["Tables"]["tournaments"]["Row"] & {
    player_count: number;
  };
