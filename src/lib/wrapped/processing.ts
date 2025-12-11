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
  PlayerRole,
  RawGameRecord,
  RawRoleSnapshot,
  RawSideStats,
  ReasonSummary,
  RoleRecord,
  RoleSnapshot,
  SideStats,
  UploadSummary,
  UserProfile,
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
      .map((date) => truncateDateISO(date))
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

  for (const game of games) {
    for (const role of ["runner", "corp"] as const) {
      const username = game[role].username;
      if (!username) continue;
      const map = totals[role];
      map.set(username, (map.get(username) ?? 0) + 1);
      overall.set(username, (overall.get(username) ?? 0) + 1);
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
    const diff = differenceInDays(prev, current);
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
    const diff = differenceInDays(prev, current) - 1;
    if (diff > bestGap) {
      bestGap = diff;
      bestStart = prev;
      bestEnd = current;
    }
  }

  if (bestGap <= 0) return null;
  return { days: bestGap, start: bestStart, end: bestEnd };
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
      best = { date: new Date(key), games: gamesCount };
    }
  }
  return best;
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
    dates.add(truncateDateISO(game.completedAt));
  }
  return Array.from(dates)
    .map((value) => new Date(value))
    .sort((a, b) => a.getTime() - b.getTime());
}

function buildDailyCounts(games: GameRecord[], username: string) {
  const counts = new Map<string, number>();
  for (const game of games) {
    if (!game.completedAt) continue;
    if (!resolveUserRole(game, username)) continue;
    const key = truncateDateISO(game.completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function truncateDateISO(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

function differenceInDays(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(a);
  const end = new Date(b);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
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
    return { username: null, identity: null };
  }
  const rawPlayer = rawRole.player;
  const username =
    rawPlayer &&
    typeof rawPlayer === "object" &&
    typeof rawPlayer.username === "string"
      ? rawPlayer.username
      : null;
  const identity =
    typeof rawRole.identity === "string" ? rawRole.identity : null;
  return { username, identity };
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
  return {
    role,
    value,
    identity: userSnapshot.identity,
    opponent: opponentSnapshot.username,
    opponentIdentity: opponentSnapshot.identity,
    completedAt: game.completedAt,
    turnCount: game.turnCount,
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
