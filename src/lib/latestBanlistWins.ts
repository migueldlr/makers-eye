import { and, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { matches, tournaments } from "@/db/schema";
import { db } from "@/utils/drizzle/client";

export type LatestBanlistWins = {
  runnerWins: number;
  corpWins: number;
};

export async function getLatestBanlistWins(): Promise<LatestBanlistWins> {
  const latestBanlist = db
    .select({ banlist: tournaments.meta })
    .from(tournaments)
    .where(and(isNotNull(tournaments.date), ne(tournaments.meta, "")))
    .orderBy(desc(tournaments.date), desc(tournaments.id))
    .limit(1)
    .as("latest_banlist");

  const [totals] = await db
    .select({
      runnerWins:
        sql<number>`count(*) filter (where ${matches.result} = 'runnerWin')`.mapWith(
          Number
        ),
      corpWins:
        sql<number>`count(*) filter (where ${matches.result} = 'corpWin')`.mapWith(
          Number
        ),
    })
    .from(matches)
    .innerJoin(tournaments, eq(matches.tournamentId, tournaments.id))
    .innerJoin(latestBanlist, eq(tournaments.meta, latestBanlist.banlist));

  return totals ?? { runnerWins: 0, corpWins: 0 };
}
