import {
  pgTable,
  pgPolicy,
  bigint,
  timestamp,
  jsonb,
  text,
  date,
  foreignKey,
  numeric,
  pgView,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const decklists = pgTable(
  "decklists",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "decklists_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    cards: jsonb(),
    archetype: text(),
  },
  (table) => [
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Enable update for authenticated users only", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
  ]
);

export const tournaments = pgTable(
  "tournaments",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "tournaments_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    lastModifiedAt: timestamp("last_modified_at", { mode: "string" }),
    name: text(),
    url: text(),
    meta: text().default("").notNull(),
    date: date(),
    location: text(),
    region: text(),
    format: text().default("sss"),
    abrUrl: text("abr_url"),
    cardpool: text().default("Standard"),
  },
  (table) => [
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
  ]
);

export const cards = pgTable(
  "cards",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "cards_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    type: text().notNull(),
  },
  (table) => [
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Enable update for authenticated users only", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
  ]
);

export const standings = pgTable(
  "standings",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "standings_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    name: text().default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tournamentId: bigint("tournament_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    corpWins: bigint("corp_wins", { mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    corpLosses: bigint("corp_losses", { mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    corpDraws: bigint("corp_draws", { mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    corpIdentity: text("corp_identity").default("").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    runnerWins: bigint("runner_wins", { mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    runnerLosses: bigint("runner_losses", { mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    runnerDraws: bigint("runner_draws", { mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    runnerIdentity: text("runner_identity").default("").notNull(),
    sos: numeric().notNull(),
    eSos: numeric("e_sos").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    swissRank: bigint("swiss_rank", { mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    topCutRank: bigint("top_cut_rank", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    matchPoints: bigint("match_points", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    corpDeckId: bigint("corp_deck_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    runnerDeckId: bigint("runner_deck_id", { mode: "number" }),
  },
  (table) => [
    foreignKey({
      columns: [table.tournamentId],
      foreignColumns: [tournaments.id],
      name: "standings_tournament_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Enable update for authenticated users only", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
  ]
);

export const matches = pgTable(
  "matches",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "matches_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tournamentId: bigint("tournament_id", { mode: "number" }).notNull(),
    phase: text().default("").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    round: bigint({ mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    table: bigint({ mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    corpId: bigint("corp_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    runnerId: bigint("runner_id", { mode: "number" }),
    result: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.corpId],
      foreignColumns: [standings.id],
      name: "matches_corp_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.runnerId],
      foreignColumns: [standings.id],
      name: "matches_runner_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tournamentId],
      foreignColumns: [tournaments.id],
      name: "matches_tournament_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
  ]
);

export const identityNames = pgTable(
  "identity_names",
  {
    longId: text("long_id").primaryKey().notNull(),
    shortId: text("short_id"),
  },
  (table) => [
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ]
);
export const standingsMapped = pgView("standings_mapped", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" }),
  name: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tournamentId: bigint("tournament_id", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  corpWins: bigint("corp_wins", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  corpLosses: bigint("corp_losses", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  corpDraws: bigint("corp_draws", { mode: "number" }),
  corpIdentity: text("corp_identity"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  runnerWins: bigint("runner_wins", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  runnerLosses: bigint("runner_losses", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  runnerDraws: bigint("runner_draws", { mode: "number" }),
  runnerIdentity: text("runner_identity"),
  sos: numeric(),
  eSos: numeric("e_sos"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  swissRank: bigint("swiss_rank", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  topCutRank: bigint("top_cut_rank", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  matchPoints: bigint("match_points", { mode: "number" }),
  corpShortId: text("corp_short_id"),
  runnerShortId: text("runner_short_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  corpDeckId: bigint("corp_deck_id", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  runnerDeckId: bigint("runner_deck_id", { mode: "number" }),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT standings.id, standings.name, standings.created_at, standings.tournament_id, standings.corp_wins, standings.corp_losses, standings.corp_draws, standings.corp_identity, standings.runner_wins, standings.runner_losses, standings.runner_draws, standings.runner_identity, standings.sos, standings.e_sos, standings.swiss_rank, standings.top_cut_rank, standings.match_points, corp_short_ids.short_id AS corp_short_id, runner_short_ids.short_id AS runner_short_id, standings.corp_deck_id, standings.runner_deck_id FROM standings LEFT JOIN identity_names corp_short_ids ON corp_short_ids.long_id = standings.corp_identity LEFT JOIN identity_names runner_short_ids ON runner_short_ids.long_id = standings.runner_identity`
  );

export const matchesMapped = pgView("matches_mapped", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tournamentId: bigint("tournament_id", { mode: "number" }),
  phase: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  round: bigint({ mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  table: bigint({ mode: "number" }),
  corpShortId: text("corp_short_id"),
  runnerShortId: text("runner_short_id"),
  result: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  runnerId: bigint("runner_id", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  corpId: bigint("corp_id", { mode: "number" }),
})
  .with({ securityInvoker: true })
  .as(
    sql`WITH mapped_standings AS ( SELECT standings.id, standings.name, standings.created_at, standings.tournament_id, standings.corp_wins, standings.corp_losses, standings.corp_draws, standings.corp_identity, standings.runner_wins, standings.runner_losses, standings.runner_draws, standings.runner_identity, standings.sos, standings.e_sos, standings.swiss_rank, standings.top_cut_rank, standings.match_points, corp_short_ids.short_id AS corp_short_id, runner_short_ids.short_id AS runner_short_id FROM standings LEFT JOIN identity_names corp_short_ids ON corp_short_ids.long_id = standings.corp_identity LEFT JOIN identity_names runner_short_ids ON runner_short_ids.long_id = standings.runner_identity ) SELECT matches.tournament_id, matches.phase, matches.round, matches."table", corp_standings.corp_short_id, runner_standings.runner_short_id, matches.result, matches.runner_id, matches.corp_id FROM matches LEFT JOIN mapped_standings corp_standings ON matches.corp_id = corp_standings.id LEFT JOIN mapped_standings runner_standings ON matches.runner_id = runner_standings.id`
  );

export const tournamentsWithPlayerCount = pgView(
  "tournaments_with_player_count",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
    lastModifiedAt: timestamp("last_modified_at", { mode: "string" }),
    name: text(),
    url: text(),
    meta: text(),
    date: date(),
    location: text(),
    region: text(),
    format: text(),
    abrUrl: text("abr_url"),
    cardpool: text(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    playerCount: bigint("player_count", { mode: "number" }),
  }
)
  .with({ securityInvoker: true })
  .as(
    sql`SELECT t.id, t.created_at, t.last_modified_at, t.name, t.url, t.meta, t.date, t.location, t.region, t.format, t.abr_url, t.cardpool, COALESCE(player_counts.player_count, 0::bigint) AS player_count FROM tournaments t LEFT JOIN ( SELECT standings_mapped.tournament_id, count(DISTINCT standings_mapped.name) AS player_count FROM standings_mapped GROUP BY standings_mapped.tournament_id) player_counts ON t.id = player_counts.tournament_id`
  );
