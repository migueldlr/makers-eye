import { relations } from "drizzle-orm/relations";
import { tournaments, standings, matches, tournamentDecklists } from "./schema";

export const standingsRelations = relations(standings, ({one, many}) => ({
	tournament: one(tournaments, {
		fields: [standings.tournamentId],
		references: [tournaments.id]
	}),
	matches_corpId: many(matches, {
		relationName: "matches_corpId_standings_id"
	}),
	matches_runnerId: many(matches, {
		relationName: "matches_runnerId_standings_id"
	}),
	tournamentDecklists: many(tournamentDecklists),
}));

export const tournamentDecklistsRelations = relations(tournamentDecklists, ({one}) => ({
	standing: one(standings, {
		fields: [tournamentDecklists.standingId],
		references: [standings.id]
	}),
}));

export const tournamentsRelations = relations(tournaments, ({many}) => ({
	standings: many(standings),
	matches: many(matches),
}));

export const matchesRelations = relations(matches, ({one}) => ({
	standing_corpId: one(standings, {
		fields: [matches.corpId],
		references: [standings.id],
		relationName: "matches_corpId_standings_id"
	}),
	standing_runnerId: one(standings, {
		fields: [matches.runnerId],
		references: [standings.id],
		relationName: "matches_runnerId_standings_id"
	}),
	tournament: one(tournaments, {
		fields: [matches.tournamentId],
		references: [tournaments.id]
	}),
}));
