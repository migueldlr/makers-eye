import { TournamentRow } from "@/lib/localtypes";
import {
  START_DATE_FILTER_KEY,
  END_DATE_FILTER_KEY,
  REGION_FILTER_KEY,
  ONLINE_FILTER_KEY,
  META_FILTER_KEY,
  DEFAULT_META,
  isWithinDateRange,
  DEFAULT_NONE,
  PHASE_FILTER_KEY,
} from "@/lib/util";
import { createClient } from "@/utils/supabase/server";

export async function useTournamentFilter(params: {
  [key: string]: string | string[] | undefined;
}) {
  const supabase = await createClient();

  const res = await supabase.from("tournaments_with_player_count").select("*");
  const tournaments = res.data as TournamentRow[];
  const startDate = (params[START_DATE_FILTER_KEY] ?? "") as string;
  const endDate = (params[END_DATE_FILTER_KEY] ?? "") as string;
  const region = (params[REGION_FILTER_KEY] ?? "") as string;
  const online = (params[ONLINE_FILTER_KEY] ?? "") as string;
  const meta = (params[META_FILTER_KEY] ?? DEFAULT_META) as string;
  const tournamentIds = tournaments
    ?.filter((t) => isWithinDateRange(startDate, endDate, t.date))
    .filter((t) =>
      region === ""
        ? true
        : region.split(",").includes(t.region ?? DEFAULT_NONE)
    )
    .filter((t) =>
      online === "" ? true : online.split(",").includes(t.location ?? "Paper")
    )
    .filter((t) => meta === t.meta)
    .map((t) => t.id);

  const phase = (params[PHASE_FILTER_KEY] ?? "") as string;
  const includeSwiss = phase.length === 0 || phase.split(",").includes("Swiss");
  const includeCut = phase.length === 0 || phase.split(",").includes("Cut");

  return {
    tournaments,
    tournamentIds,
    includeSwiss,
    includeCut,
    meta,
  };
}
