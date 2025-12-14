import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  differenceInCalendarDays,
  addDays,
  format as formatDate,
  parse,
} from "date-fns";
import type {
  AggregateStats,
  DayActivityStat,
  FrequentOpponent,
  GameHighlight,
  GameRecord,
  Highlights,
  IdentityFavorite,
  LongestDurationGame,
  LongestDrought,
  LongestGame,
  LongestStreak,
  MonthActivityStat,
  PlayerRole,
  RawGameRecord,
  RawRoleSnapshot,
  RawSideStats,
  ReasonSummary,
  RoleRecord,
  RoleSnapshot,
  SideStats,
  TopOpponent,
  UploadSummary,
  UserProfile,
  WeekActivityStat,
  WinLossReasons,
} from "./types";

export function parseGameHistoryText(raw: string): GameRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The uploaded file is not valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("game_history.json must contain an array of games.");
  }

  return parsed.map((entry) => normalizeGame(entry as RawGameRecord));
}

export interface SummarizeOptions {
  start?: Date | null;
  end?: Date | null;
}

export function summarizeUpload(
  raw: string,
  options?: SummarizeOptions
): UploadSummary {
  let games = parseGameHistoryText(raw);
  if (options?.start || options?.end) {
    games = filterGamesByDateRange(
      games,
      options?.start ?? null,
      options?.end ?? null
    );
  }
  const profile = detectUserProfile(games);
  const aggregates = computeAggregates(games, profile?.username ?? null);
  return { games, profile, aggregates };
}

export function getDateRange(games: GameRecord[]): {
  start: Date | null;
  end: Date | null;
} {
  if (!games.length) {
    return { start: null, end: null };
  }
  const timestamps = games
    .map((game) => game.completedAt?.getTime())
    .filter((value): value is number => typeof value === "number");
  if (!timestamps.length) {
    return { start: null, end: null };
  }
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  return { start: new Date(min), end: new Date(max) };
}

export function getTotalMinutesPlayed(
  games: GameRecord[],
  username: string
): number {
  let totalMinutes = 0;
  for (const game of games) {
    if (!game.elapsedMinutes || game.elapsedMinutes <= 0) continue;
    const role = resolveUserRole(game, username);
    if (!role) continue;
    totalMinutes += game.elapsedMinutes;
  }
  return totalMinutes;
}

function computeAggregates(
  games: GameRecord[],
  username: string | null
): AggregateStats {
  if (!games.length || !username) {
    return {
      totalMinutes: 0,
      totalDays: 0,
      averageGamesPerDay: 0,
      averageMinutesPerGame: 0,
      averageMinutesPerDay: 0,
    };
  }

  const filtered = games.filter(
    (game) => resolveUserRole(game, username) !== null
  );
  const totalMinutes = filtered.reduce((sum, game) => {
    if (!game.elapsedMinutes || game.elapsedMinutes <= 0) return sum;
    return sum + game.elapsedMinutes;
  }, 0);

  const days = new Set(
    filtered
      .map((game) => game.completedAt)
      .filter((date): date is Date => !!date)
      .map((date) => truncateDateKey(date))
  );

  const totalDays = days.size;
  const averageGamesPerDay = totalDays ? filtered.length / totalDays : 0;
  const averageMinutesPerGame = filtered.length
    ? totalMinutes / filtered.length
    : 0;
  const averageMinutesPerDay = totalDays ? totalMinutes / totalDays : 0;

  return {
    totalMinutes,
    totalDays,
    averageGamesPerDay,
    averageMinutesPerGame,
    averageMinutesPerDay,
  };
}

export function detectUserProfile(games: GameRecord[]): UserProfile | null {
  if (!games.length) return null;

  const totals: Record<PlayerRole, Map<string, number>> = {
    runner: new Map(),
    corp: new Map(),
  };
  const overall = new Map<string, number>();
  const emailHashes = new Map<string, string>();

  for (const game of games) {
    for (const role of ["runner", "corp"] as const) {
      const username = game[role].username;
      if (!username) continue;
      const map = totals[role];
      map.set(username, (map.get(username) ?? 0) + 1);
      overall.set(username, (overall.get(username) ?? 0) + 1);
      // Store the emailHash if we haven't seen one for this user yet
      if (game[role].emailHash && !emailHashes.has(username)) {
        emailHashes.set(username, game[role].emailHash);
      }
    }
  }

  const chosen = pickTop(overall);
  if (!chosen) return null;

  let matchedGames = 0;
  for (const game of games) {
    if (
      game.runner.username === chosen.username ||
      game.corp.username === chosen.username
    ) {
      matchedGames += 1;
    }
  }

  return {
    username: chosen.username,
    emailHash: emailHashes.get(chosen.username) ?? null,
    runnerGames: totals.runner.get(chosen.username) ?? 0,
    corpGames: totals.corp.get(chosen.username) ?? 0,
    coverage: matchedGames / games.length,
    totalGames: games.length,
    matchedGames,
    unmatchedGames: games.length - matchedGames,
  };
}

export function resolveUserRole(
  game: GameRecord,
  username: string
): PlayerRole | null {
  if (game.runner.username === username) {
    if (game.corp.username) return "runner";
    return null;
  }
  if (game.corp.username === username) {
    if (game.runner.username) return "corp";
    return null;
  }
  return null;
}

export function filterGamesByDateRange(
  games: GameRecord[],
  start: Date | null,
  end: Date | null
): GameRecord[] {
  return games.filter((game) => {
    if (!game.runner.username || !game.corp.username) return false;
    if (!game.completedAt) return false;
    if (start && game.completedAt < start) return false;
    if (end && game.completedAt > end) return false;
    return true;
  });
}

export function buildUserRoleRecord(
  games: GameRecord[],
  username: string,
  role: PlayerRole
): RoleRecord | null {
  const relevant = games.filter(
    (game) => game.winner !== null && resolveUserRole(game, username) === role
  );
  if (!relevant.length) return null;
  const wins = relevant.reduce(
    (sum, game) => sum + (game.winner === role ? 1 : 0),
    0
  );
  const total = relevant.length;
  return {
    role,
    wins,
    losses: total - wins,
    total,
    winRate: total ? wins / total : 0,
  };
}

export function buildFavoriteIdentity(
  games: GameRecord[],
  username: string,
  role: PlayerRole
): IdentityFavorite | null {
  const acc = new Map<
    string,
    {
      wins: number;
      total: number;
    }
  >();

  for (const game of games) {
    const playerRole = resolveUserRole(game, username);
    if (playerRole !== role) continue;
    if (game.winner === null) continue;
    const identity = game[role].identity ?? "Unknown Identity";
    const bucket = acc.get(identity) ?? { wins: 0, total: 0 };
    bucket.total += 1;
    if (game.winner === role) {
      bucket.wins += 1;
    }
    acc.set(identity, bucket);
  }

  let favorite: { identity: string; wins: number; total: number } | null = null;
  for (const [identity, data] of Array.from(acc.entries())) {
    if (
      !favorite ||
      data.total > favorite.total ||
      (data.total === favorite.total && data.wins > favorite.wins)
    ) {
      favorite = { identity, wins: data.wins, total: data.total };
    }
  }

  if (!favorite) return null;
  const losses = favorite.total - favorite.wins;
  return {
    role,
    identity: favorite.identity,
    games: favorite.total,
    wins: favorite.wins,
    losses,
    winRate: favorite.total ? favorite.wins / favorite.total : 0,
  };
}

export function findLongestGame(
  games: GameRecord[],
  username: string
): LongestGame | null {
  const relevant = games
    .filter(
      (game) =>
        typeof game.turnCount === "number" && resolveUserRole(game, username)
    )
    .sort((a, b) => (b.turnCount ?? 0) - (a.turnCount ?? 0));
  if (!relevant.length) return null;
  const game = relevant[0];
  const role = resolveUserRole(game, username)!;
  const opponentRole: PlayerRole = role === "runner" ? "corp" : "runner";
  const opponent = game[opponentRole].username ?? null;
  const opponentIdentity = game[opponentRole].identity ?? null;
  const turnCount = game.turnCount ?? 0;
  let result: "win" | "loss" | "draw" = "draw";
  if (game.winner === role) result = "win";
  else if (game.winner && game.winner !== role) result = "loss";
  return {
    turnCount,
    role,
    opponent,
    opponentIdentity,
    completedAt: game.completedAt,
    result,
  };
}

export function findLongestGameByRole(
  games: GameRecord[],
  username: string,
  role: PlayerRole
): LongestGame | null {
  const relevant = games
    .filter(
      (game) =>
        typeof game.turnCount === "number" &&
        resolveUserRole(game, username) === role
    )
    .sort((a, b) => (b.turnCount ?? 0) - (a.turnCount ?? 0));
  if (!relevant.length) return null;
  const game = relevant[0];
  const opponentRole: PlayerRole = role === "runner" ? "corp" : "runner";
  const opponent = game[opponentRole].username ?? null;
  const opponentIdentity = game[opponentRole].identity ?? null;
  const turnCount = game.turnCount ?? 0;
  let result: "win" | "loss" | "draw" = "draw";
  if (game.winner === role) result = "win";
  else if (game.winner && game.winner !== role) result = "loss";
  return {
    turnCount,
    role,
    opponent,
    opponentIdentity,
    completedAt: game.completedAt,
    result,
  };
}

export function findMostFrequentOpponent(
  games: GameRecord[],
  username: string
): FrequentOpponent | null {
  const buckets = new Map<
    string,
    {
      wins: number;
      total: number;
    }
  >();

  for (const game of games) {
    const role = resolveUserRole(game, username);
    if (!role) continue;
    const opponentRole: PlayerRole = role === "runner" ? "corp" : "runner";
    const opponent = game[opponentRole].username;
    if (!opponent) continue;
    const bucket = buckets.get(opponent) ?? { wins: 0, total: 0 };
    bucket.total += 1;
    if (game.winner === role) {
      bucket.wins += 1;
    }
    buckets.set(opponent, bucket);
  }

  let favorite: { username: string; wins: number; total: number } | null = null;
  for (const [enemy, data] of Array.from(buckets.entries())) {
    if (
      !favorite ||
      data.total > favorite.total ||
      (data.total === favorite.total && data.wins > favorite.wins)
    ) {
      favorite = { username: enemy, wins: data.wins, total: data.total };
    }
  }

  if (!favorite) return null;

  const losses = favorite.total - favorite.wins;
  return {
    username: favorite.username,
    games: favorite.total,
    wins: favorite.wins,
    losses,
    winRate: favorite.total ? favorite.wins / favorite.total : 0,
  };
}

export function findTopOpponents(
  games: GameRecord[],
  username: string,
  limit = 20
): TopOpponent[] {
  const buckets = new Map<
    string,
    {
      emailHash: string | null;
      wins: number;
      total: number;
    }
  >();

  for (const game of games) {
    const role = resolveUserRole(game, username);
    if (!role) continue;
    const opponentRole: PlayerRole = role === "runner" ? "corp" : "runner";
    const opponent = game[opponentRole].username;
    if (!opponent) continue;

    const existing = buckets.get(opponent);
    const emailHash = game[opponentRole].emailHash;

    const bucket = existing ?? { emailHash: null, wins: 0, total: 0 };
    bucket.total += 1;
    if (game.winner === role) {
      bucket.wins += 1;
    }
    // Keep the first non-null emailHash we find
    if (!bucket.emailHash && emailHash) {
      bucket.emailHash = emailHash;
    }
    buckets.set(opponent, bucket);
  }

  const sorted = Array.from(buckets.entries())
    .map(([opponentName, data]) => ({
      username: opponentName,
      emailHash: data.emailHash,
      games: data.total,
      wins: data.wins,
      losses: data.total - data.wins,
      winRate: data.total ? data.wins / data.total : 0,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, limit);

  return sorted;
}

export function findLongestDurationGame(
  games: GameRecord[],
  username: string
): LongestDurationGame | null {
  const relevant = games
    .filter(
      (game) =>
        resolveUserRole(game, username) &&
        typeof game.elapsedMinutes === "number" &&
        game.elapsedMinutes > 0
    )
    .sort((a, b) => (b.elapsedMinutes ?? 0) - (a.elapsedMinutes ?? 0));
  if (!relevant.length) return null;
  const game = relevant[0];
  const role = resolveUserRole(game, username)!;
  const opponentRole: PlayerRole = role === "runner" ? "corp" : "runner";
  const opponent = game[opponentRole].username ?? null;
  let result: "win" | "loss" | "draw" = "draw";
  if (game.winner === role) result = "win";
  else if (game.winner && game.winner !== role) result = "loss";
  return {
    minutes: game.elapsedMinutes ?? 0,
    role,
    opponent,
    completedAt: game.completedAt,
    result,
  };
}

export function findLongestStreak(
  games: GameRecord[],
  username: string
): LongestStreak | null {
  const days = getPlayerGameDays(games, username);
  if (!days.length) return null;
  let bestLen = 1;
  let currentLen = 1;
  let bestStart = days[0];
  let bestEnd = days[0];
  let streakStart = days[0];

  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const current = days[i];
    const diff = differenceInCalendarDays(current, prev);
    if (diff === 1) {
      currentLen += 1;
    } else {
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = streakStart;
        bestEnd = prev;
      }
      currentLen = 1;
      streakStart = current;
    }
  }
  if (currentLen > bestLen) {
    bestLen = currentLen;
    bestStart = streakStart;
    bestEnd = days[days.length - 1];
  }

  return { days: bestLen, start: bestStart, end: bestEnd };
}

export function findLongestDrought(
  games: GameRecord[],
  username: string
): LongestDrought | null {
  const days = getPlayerGameDays(games, username);
  if (days.length < 2) return null;
  let bestGap = 0;
  let bestStart = days[0];
  let bestEnd = days[0];

  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const current = days[i];
    const diff = differenceInCalendarDays(current, prev) - 1;
    if (diff > bestGap) {
      bestGap = diff;
      bestStart = prev;
      bestEnd = current;
    }
  }

  if (bestGap <= 0) return null;
  // Return actual drought dates (days without games), not game boundary dates
  return {
    days: bestGap,
    start: addDays(bestStart, 1), // First day without a game
    end: addDays(bestEnd, -1), // Last day without a game
  };
}

export function findBusiestDay(
  games: GameRecord[],
  username: string
): DayActivityStat | null {
  const counts = buildDailyCounts(games, username);
  if (!counts.size) return null;
  let best: { date: Date; games: number } | null = null;
  for (const [key, gamesCount] of Array.from(counts.entries())) {
    if (!best || gamesCount > best.games) {
      best = { date: parse(key, "yyyy-MM-dd", new Date()), games: gamesCount };
    }
  }
  return best;
}

export function findBusiestWeek(
  games: GameRecord[],
  username: string
): WeekActivityStat | null {
  const counts = new Map<string, { weekStart: Date; games: number }>();

  for (const game of games) {
    if (!game.completedAt) continue;
    if (!resolveUserRole(game, username)) continue;

    const date = new Date(game.completedAt);
    const weekStartDate = startOfWeek(date, { weekStartsOn: 0 });
    const key = formatDate(weekStartDate, "yyyy-MM-dd");
    const existing = counts.get(key);
    if (existing) {
      existing.games += 1;
    } else {
      counts.set(key, { weekStart: weekStartDate, games: 1 });
    }
  }

  if (!counts.size) return null;

  let best: { weekStart: Date; games: number } | null = null;
  for (const entry of Array.from(counts.values())) {
    if (!best || entry.games > best.games) {
      best = { weekStart: entry.weekStart, games: entry.games };
    }
  }

  if (!best) return null;

  return {
    weekStart: best.weekStart,
    weekEnd: endOfWeek(best.weekStart, { weekStartsOn: 0 }),
    games: best.games,
  };
}

export function findBusiestMonth(
  games: GameRecord[],
  username: string
): MonthActivityStat | null {
  const counts = new Map<string, { monthStart: Date; games: number }>();

  for (const game of games) {
    if (!game.completedAt) continue;
    if (!resolveUserRole(game, username)) continue;

    const date = new Date(game.completedAt);
    const monthStartDate = startOfMonth(date);
    const key = formatDate(monthStartDate, "yyyy-MM");
    const existing = counts.get(key);
    if (existing) {
      existing.games += 1;
    } else {
      counts.set(key, { monthStart: monthStartDate, games: 1 });
    }
  }

  if (!counts.size) return null;

  let best: { monthStart: Date; games: number } | null = null;
  for (const entry of Array.from(counts.values())) {
    if (!best || entry.games > best.games) {
      best = { monthStart: entry.monthStart, games: entry.games };
    }
  }

  if (!best) return null;

  return {
    monthStart: best.monthStart,
    monthEnd: endOfMonth(best.monthStart),
    games: best.games,
  };
}

export function buildHighlights(
  games: GameRecord[],
  username: string
): Highlights {
  const max = (candidate: number, current: number) => candidate > current;
  const min = (candidate: number, current: number) => candidate < current;
  const ratio = (value: number | null, turns: number | null) => {
    if (!value || !turns || turns <= 0) return null;
    return value / turns;
  };

  return {
    mostShuffles: findGameHighlight(
      games,
      username,
      (stats) =>
        stats.shuffleCount && stats.shuffleCount > 0
          ? stats.shuffleCount
          : null,
      max
    ),
    mostShufflesRunner: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "runner" && stats.shuffleCount && stats.shuffleCount > 0
          ? stats.shuffleCount
          : null,
      max
    ),
    mostShufflesCorp: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "corp" && stats.shuffleCount && stats.shuffleCount > 0
          ? stats.shuffleCount
          : null,
      max
    ),
    mostClicksPerTurn: findGameHighlight(
      games,
      username,
      (stats, game) => ratio(stats.clicksGained, game.turnCount),
      max
    ),
    mostClicksPerTurnCorp: findGameHighlight(
      games,
      username,
      (stats, game, role) =>
        role === "corp" ? ratio(stats.clicksGained, game.turnCount) : null,
      max
    ),
    leastClicksPerTurn: findGameHighlight(
      games,
      username,
      (stats, game) => ratio(stats.clicksGained, game.turnCount),
      min
    ),
    mostCreditsPerTurn: findGameHighlight(
      games,
      username,
      (stats, game) => ratio(stats.creditsGained, game.turnCount),
      max
    ),
    mostCreditsPerTurnCorp: findGameHighlight(
      games,
      username,
      (stats, game, role) =>
        role === "corp" ? ratio(stats.creditsGained, game.turnCount) : null,
      max
    ),
    leastCreditsPerTurn: findGameHighlight(
      games,
      username,
      (stats, game) => ratio(stats.creditsGained, game.turnCount),
      min
    ),
    mostCardsPlayed: findGameHighlight(
      games,
      username,
      (stats) =>
        stats.cardsPlayed && stats.cardsPlayed > 0 ? stats.cardsPlayed : null,
      max
    ),
    mostCardsPlayedRunner: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "runner" && stats.cardsPlayed && stats.cardsPlayed > 0
          ? stats.cardsPlayed
          : null,
      max
    ),
    mostCardsPlayedCorp: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "corp" && stats.cardsPlayed && stats.cardsPlayed > 0
          ? stats.cardsPlayed
          : null,
      max
    ),
    mostCardsRezzed: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "corp" && stats.cardsRezzed && stats.cardsRezzed > 0
          ? stats.cardsRezzed
          : null,
      max
    ),
    mostCardsDrawn: findGameHighlight(
      games,
      username,
      (stats) =>
        stats.cardsDrawn && stats.cardsDrawn > 0 ? stats.cardsDrawn : null,
      max
    ),
    mostCardsDrawnRunner: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "runner" && stats.cardsDrawn && stats.cardsDrawn > 0
          ? stats.cardsDrawn
          : null,
      max
    ),
    mostCardsDrawnCorp: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "corp" && stats.cardsDrawn && stats.cardsDrawn > 0
          ? stats.cardsDrawn
          : null,
      max
    ),
    mostRuns: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "runner" && stats.runsStarted && stats.runsStarted > 0
          ? stats.runsStarted
          : null,
      max
    ),
    mostRunsPerClick: findGameHighlight(
      games,
      username,
      (stats, _game, role) => {
        if (role !== "runner") return null;
        const runs = stats.runsStarted ?? 0;
        const clicks = stats.clicksGained ?? 0;
        if (runs <= 0 || clicks <= 0) return null;
        return runs / clicks;
      },
      max
    ),
    mostUniqueAccesses: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "runner") return null;
        const uniqueAccesses = game.runnerUniqueAccesses;
        if (typeof uniqueAccesses !== "number" || uniqueAccesses <= 0)
          return null;
        return uniqueAccesses;
      },
      max
    ),
    mostDamage: findGameHighlight(
      games,
      username,
      (stats, _game, role) =>
        role === "corp" && stats.damageDone && stats.damageDone > 0
          ? stats.damageDone
          : null,
      max
    ),
    mostDamageTaken: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "runner") return null;
        const corpDamage = game.corpStats.damageDone ?? 0;
        return corpDamage > 0 ? corpDamage : null;
      },
      max
    ),
    mostDamageTakenWin: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "runner" || game.winner !== role) return null;
        const corpDamage = game.corpStats.damageDone ?? 0;
        return corpDamage > 0 ? corpDamage : null;
      },
      max
    ),
    mostFakeCredits: findGameHighlight(
      games,
      username,
      (stats) => {
        const gained = stats.creditsGained ?? 0;
        const spent = stats.creditsSpent ?? 0;
        const diff = spent - gained;
        return diff > 0 ? diff : null;
      },
      max
    ),
    mostFakeCreditsRunner: findGameHighlight(
      games,
      username,
      (stats, _game, role) => {
        if (role !== "runner") return null;
        const gained = stats.creditsGained ?? 0;
        const spent = stats.creditsSpent ?? 0;
        const diff = spent - gained;
        return diff > 0 ? diff : null;
      },
      max
    ),
    mostFakeCreditsPerTurn: findGameHighlight(
      games,
      username,
      (stats, game) => {
        const gained = stats.creditsGained ?? 0;
        const spent = stats.creditsSpent ?? 0;
        const diff = spent - gained;
        return diff > 0 ? ratio(diff, game.turnCount) : null;
      },
      max
    ),
    leastUniqueAccessesAgendaWin: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "runner" || game.winner !== role) return null;
        const reason = normalizeReason(game.reason ?? "");
        if (!reason.toLowerCase().includes("agenda")) return null;
        const uniqueAccesses = game.runnerUniqueAccesses;
        if (typeof uniqueAccesses !== "number" || uniqueAccesses < 0)
          return null;
        return uniqueAccesses;
      },
      min
    ),
    fewestCardsRezzedCorpWin: findGameHighlight(
      games,
      username,
      (stats, game, role) => {
        if (role !== "corp" || game.winner !== role) return null;
        const reason = normalizeReason(game.reason ?? "");
        if (isConcedeReason(reason)) return null;
        const rezzed = stats.cardsRezzed ?? 0;
        return rezzed >= 0 ? rezzed : null;
      },
      min
    ),
    mostTagsTaken: findGameHighlight(
      games,
      username,
      (stats, _game, role) => {
        if (role !== "runner") return null;
        const tags = stats.tagsGained ?? 0;
        return tags > 0 ? tags : null;
      },
      max
    ),
    leastRunsInWin: findGameHighlight(
      games,
      username,
      (stats, game, role) => {
        if (role !== "runner" || game.winner !== role) return null;
        // Exclude concedes - we want real wins
        const reason = normalizeReason(game.reason ?? "");
        if (isConcedeReason(reason)) return null;
        const runs = stats.runsStarted ?? 0;
        return runs >= 0 ? runs : null;
      },
      min
    ),
    fastestFlatlineWin: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "corp" || game.winner !== role) return null;
        const reason = normalizeReason(game.reason ?? "");
        if (!reason.toLowerCase().includes("flatline")) return null;
        const turns = game.turnCount;
        if (typeof turns !== "number" || turns <= 0) return null;
        return turns;
      },
      min
    ),
    fastestAgendaWin: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "runner" || game.winner !== role) return null;
        const reason = normalizeReason(game.reason ?? "");
        if (!reason.toLowerCase().includes("agenda")) return null;
        const turns = game.turnCount;
        if (typeof turns !== "number" || turns <= 0) return null;
        return turns;
      },
      min
    ),
    leastCreditsSpentWin: findGameHighlight(
      games,
      username,
      (stats, game, role) => {
        if (game.winner !== role) return null;
        const reason = normalizeReason(game.reason ?? "");
        if (isConcedeReason(reason)) {
          return null;
        }
        const spent = stats.creditsSpent ?? 0;
        return spent >= 0 ? spent : null;
      },
      min
    ),
    // Excess clicks = clicks gained beyond base allocation
    // Runner gets 4 clicks per turn, Corp gets 3 clicks per turn
    // turnCount represents the game turn number (corp goes first)
    // For runner: if game ends on turn N, runner had N turns (if runner's turn) or N-1 turns (if corp's turn)
    // We use turnCount as an upper bound for runner turns
    mostExcessClicksRunner: findGameHighlight(
      games,
      username,
      (stats, game, role) => {
        if (role !== "runner") return null;
        const clicks = stats.clicksGained ?? 0;
        const turns = game.turnCount ?? 0;
        if (clicks <= 0 || turns <= 0) return null;
        // Runner gets 4 base clicks per turn
        const baseClicks = turns * 4;
        const excess = clicks - baseClicks;
        return excess > 0 ? excess : null;
      },
      max
    ),
    mostExcessClicksCorp: findGameHighlight(
      games,
      username,
      (stats, game, role) => {
        if (role !== "corp") return null;
        const clicks = stats.clicksGained ?? 0;
        const turns = game.turnCount ?? 0;
        if (clicks <= 0 || turns <= 0) return null;
        // Corp gets 3 base clicks per turn
        const baseClicks = turns * 3;
        const excess = clicks - baseClicks;
        return excess > 0 ? excess : null;
      },
      max
    ),
    longestGameRunner: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "runner") return null;
        const turns = game.turnCount;
        if (typeof turns !== "number" || turns <= 0) return null;
        return turns;
      },
      max
    ),
    longestGameCorp: findGameHighlight(
      games,
      username,
      (_stats, game, role) => {
        if (role !== "corp") return null;
        const turns = game.turnCount;
        if (typeof turns !== "number" || turns <= 0) return null;
        return turns;
      },
      max
    ),
  };
}

export function buildWinLossReasons(
  games: GameRecord[],
  username: string
): WinLossReasons {
  const winMap = new Map<string, number>();
  const lossMap = new Map<string, number>();
  let winTotal = 0;
  let lossTotal = 0;

  for (const game of games) {
    const role = resolveUserRole(game, username);
    if (!role) continue;
    if (!game.reason) continue;
    const normalized = normalizeReason(game.reason);
    if (game.winner === role) {
      winTotal += 1;
      winMap.set(normalized, (winMap.get(normalized) ?? 0) + 1);
    } else if (game.winner && game.winner !== role) {
      lossTotal += 1;
      lossMap.set(normalized, (lossMap.get(normalized) ?? 0) + 1);
    }
  }

  return {
    wins: pickReasonSummary(winMap, winTotal),
    losses: pickReasonSummary(lossMap, lossTotal),
  };
}

function getPlayerGameDays(games: GameRecord[], username: string): Date[] {
  const dates = new Set<string>();
  for (const game of games) {
    if (!game.completedAt) continue;
    if (!resolveUserRole(game, username)) continue;
    dates.add(truncateDateKey(game.completedAt));
  }
  return Array.from(dates)
    .map((value) => parse(value, "yyyy-MM-dd", new Date()))
    .sort((a, b) => a.getTime() - b.getTime());
}

function buildDailyCounts(games: GameRecord[], username: string) {
  const counts = new Map<string, number>();
  for (const game of games) {
    if (!game.completedAt) continue;
    if (!resolveUserRole(game, username)) continue;
    const key = truncateDateKey(game.completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function truncateDateKey(date: Date) {
  return formatDate(startOfDay(date), "yyyy-MM-dd");
}

function normalizeGame(rawGame: RawGameRecord): GameRecord {
  const startedAt = parseDate(
    rawGame?.["start-date"] ?? rawGame?.["creation-date"]
  );
  const completedAt = parseDate(
    rawGame?.["end-date"] ??
      rawGame?.["start-date"] ??
      rawGame?.["creation-date"]
  );
  const elapsedMinutes = toNumber(rawGame?.stats?.time?.elapsed);
  return {
    winner: isRole(rawGame?.winner) ? rawGame.winner : null,
    runner: normalizeRole(rawGame?.runner),
    corp: normalizeRole(rawGame?.corp),
    completedAt,
    startedAt,
    elapsedMinutes:
      typeof elapsedMinutes === "number" ? Math.max(0, elapsedMinutes) : null,
    format:
      typeof rawGame?.format === "string"
        ? rawGame.format.trim().toLowerCase()
        : null,
    runnerUniqueAccesses: parseRunnerUniqueAccesses(rawGame),
    turnCount: parseTurnCount(rawGame?.turn),
    runnerStats: parseSideStats(rawGame?.stats?.runner, false),
    corpStats: parseSideStats(rawGame?.stats?.corp, true),
    reason: typeof rawGame?.reason === "string" ? rawGame.reason : null,
  };
}

function normalizeRole(
  rawRole: RawRoleSnapshot | null | undefined
): RoleSnapshot {
  if (!rawRole || typeof rawRole !== "object") {
    return { username: null, identity: null, emailHash: null };
  }
  const rawPlayer = rawRole.player;
  const username =
    rawPlayer &&
    typeof rawPlayer === "object" &&
    typeof rawPlayer.username === "string"
      ? rawPlayer.username
      : null;
  const emailHash =
    rawPlayer &&
    typeof rawPlayer === "object" &&
    typeof rawPlayer.emailhash === "string"
      ? rawPlayer.emailhash
      : null;
  const identity =
    typeof rawRole.identity === "string" ? rawRole.identity : null;
  return { username, identity, emailHash };
}

function pickTop(map: Map<string, number>) {
  let top: { username: string; count: number } | null = null;
  for (const [username, count] of Array.from(map.entries())) {
    if (!top || count > top.count) {
      top = { username, count };
    }
  }
  return top;
}

function isRole(value: unknown): value is PlayerRole {
  return value === "runner" || value === "corp";
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp);
}

function parseRunnerUniqueAccesses(rawGame: RawGameRecord): number | null {
  const uniqueCards = rawGame?.stats?.runner?.access?.["unique-cards"];
  if (Array.isArray(uniqueCards)) {
    return uniqueCards.length;
  }
  if (
    typeof uniqueCards === "number" &&
    Number.isFinite(uniqueCards) &&
    uniqueCards >= 0
  ) {
    return Math.floor(uniqueCards);
  }
  return null;
}

function parseTurnCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed);
    }
  }
  return null;
}

function parseSideStats(
  rawStats: RawSideStats | null | undefined,
  isCorp: boolean
): SideStats {
  return {
    clicksGained: toNumber(rawStats?.gain?.click),
    creditsGained: toNumber(rawStats?.gain?.credit),
    creditsSpent: toNumber(rawStats?.spent?.credit),
    creditsFromClicks: toNumber(rawStats?.click?.credit),
    cardsDrawn: toNumber(rawStats?.gain?.card),
    cardsFromClicks: toNumber(rawStats?.click?.draw),
    shuffleCount: toNumber(rawStats?.["shuffle-count"]),
    cardsPlayed: toNumber(rawStats?.["cards-played"]?.["play-instant"]),
    cardsRezzed: isCorp ? toNumber(rawStats?.cards?.rezzed) : null,
    runsStarted: toNumber(rawStats?.runs?.started),
    cardsAccessed: toNumber(rawStats?.access?.cards),
    damageDone: toNumber(rawStats?.damage?.all),
    tagsGained: !isCorp ? toNumber(rawStats?.gain?.tag?.base) : null,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function findGameHighlight(
  games: GameRecord[],
  username: string,
  selector: (
    stats: SideStats,
    game: GameRecord,
    role: PlayerRole
  ) => number | null,
  comparator: (candidate: number, current: number) => boolean
): GameHighlight | null {
  let best: { value: number; game: GameRecord; role: PlayerRole } | null = null;
  for (const game of games) {
    const role = resolveUserRole(game, username);
    if (!role) continue;
    const stats = role === "runner" ? game.runnerStats : game.corpStats;
    const value = selector(stats, game, role);
    if (value === null || Number.isNaN(value)) continue;
    if (!best || comparator(value, best.value)) {
      best = { value, game, role };
    }
  }
  if (!best) return null;
  return buildGameHighlight(best.game, best.role, best.value);
}

function buildGameHighlight(
  game: GameRecord,
  role: PlayerRole,
  value: number
): GameHighlight {
  const userSnapshot = game[role];
  const opponentRole: PlayerRole = role === "runner" ? "corp" : "runner";
  const opponentSnapshot = game[opponentRole];

  let result: "win" | "loss" | "draw" = "draw";
  if (game.winner === role) result = "win";
  else if (game.winner && game.winner !== role) result = "loss";

  return {
    role,
    value,
    identity: userSnapshot.identity,
    opponent: opponentSnapshot.username,
    opponentIdentity: opponentSnapshot.identity,
    completedAt: game.completedAt,
    turnCount: game.turnCount,
    result,
    reason: game.reason,
  };
}

function normalizeReason(reason: string) {
  const trimmed = reason.trim();
  return trimmed.length ? trimmed : "Unknown";
}

function isConcedeReason(reason: string) {
  const normalized = reason.trim().toLowerCase();
  return normalized === "concede" || normalized === "conceded";
}

function pickReasonSummary(
  map: Map<string, number>,
  total: number
): ReasonSummary | null {
  if (!total || !map.size) return null;
  let best: { reason: string; count: number } | null = null;
  for (const [reason, count] of Array.from(map.entries())) {
    if (!best || count > best.count) {
      best = { reason, count };
    }
  }
  if (!best) return null;
  return {
    reason: best.reason,
    count: best.count,
    total,
    percent: total ? best.count / total : 0,
  };
}
