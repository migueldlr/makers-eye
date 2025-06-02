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
  ONLY_FILTER_KEY,
} from "@/lib/util";

export function parseTournamentParams({
  params,
  tournaments,
}: {
  params: {
    [key: string]: string | string[] | undefined;
  };
  tournaments: TournamentRow[];
}) {
  const startDate = (params[START_DATE_FILTER_KEY] ?? "") as string;
  const endDate = (params[END_DATE_FILTER_KEY] ?? "") as string;
  const region = (params[REGION_FILTER_KEY] ?? "") as string;
  const online = (params[ONLINE_FILTER_KEY] ?? "") as string;
  const meta = (params[META_FILTER_KEY] ?? DEFAULT_META) as string;
  const specificIds = (params[ONLY_FILTER_KEY] ?? "") as string;

  const phase = (params[PHASE_FILTER_KEY] ?? "") as string;
  const includeSwiss = phase.length === 0 || phase.split(",").includes("Swiss");
  const includeCut = phase.length === 0 || phase.split(",").includes("Cut");

  if (specificIds.length > 0) {
    return {
      tournamentIds: specificIds.split(",").map((id) => parseInt(id)),
      includeSwiss,
      includeCut,
      meta,
    };
  }
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

  return {
    tournamentIds,
    includeSwiss,
    includeCut,
    meta,
  };
}
