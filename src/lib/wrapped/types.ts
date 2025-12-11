export type PlayerRole = "runner" | "corp";

export interface RoleSnapshot {
  username: string | null;
  identity: string | null;
  emailHash: string | null;
}

export interface SideStats {
  clicksGained: number | null;
  creditsGained: number | null;
  creditsSpent: number | null;
  creditsFromClicks: number | null;
  cardsDrawn: number | null;
  cardsFromClicks: number | null;
  shuffleCount: number | null;
  cardsPlayed: number | null;
  cardsRezzed: number | null;
  runsStarted: number | null;
  cardsAccessed: number | null;
  damageDone: number | null;
  tagsGained: number | null;
}

export interface GameRecord {
  winner: PlayerRole | null;
  runner: RoleSnapshot;
  corp: RoleSnapshot;
  completedAt: Date | null;
  startedAt: Date | null;
  elapsedMinutes: number | null;
  format: string | null;
  runnerUniqueAccesses: number | null;
  turnCount: number | null;
  runnerStats: SideStats;
  corpStats: SideStats;
  reason: string | null;
}

export interface RawGameRecord {
  winner?: unknown;
  runner?: RawRoleSnapshot;
  corp?: RawRoleSnapshot;
  format?: unknown;
  ["end-date"]?: unknown;
  ["start-date"]?: unknown;
  ["creation-date"]?: unknown;
  stats?: RawStatsContainer;
  turn?: unknown;
  reason?: unknown;
}

export interface RawRoleSnapshot {
  player?: RawPlayer;
  identity?: unknown;
}

export interface RawPlayer {
  username?: unknown;
  emailhash?: unknown;
}

export interface RawSideStats {
  gain?: {
    click?: unknown;
    credit?: unknown;
    card?: unknown;
    tag?: { base?: unknown };
  };
  spent?: {
    credit?: unknown;
  };
  click?: {
    credit?: unknown;
    draw?: unknown;
  };
  runs?: {
    started?: unknown;
  };
  access?: {
    cards?: unknown;
    ["unique-cards"]?: unknown;
  };
  damage?: {
    all?: unknown;
  };
  cards?: {
    rezzed?: unknown;
  };
  ["cards-played"]?: {
    ["play-instant"]?: unknown;
  };
  ["shuffle-count"]?: unknown;
}

export interface RawStatsContainer {
  runner?: RawSideStats | null;
  corp?: RawSideStats | null;
  time?: {
    elapsed?: unknown;
  };
}

export interface UserProfile {
  username: string;
  emailHash: string | null;
  totalGames: number;
  runnerGames: number;
  corpGames: number;
  coverage: number;
  matchedGames: number;
  unmatchedGames: number;
}

export interface UploadSummary {
  games: GameRecord[];
  profile: UserProfile | null;
  aggregates: AggregateStats;
}

export interface AggregateStats {
  totalMinutes: number;
  totalDays: number;
  averageGamesPerDay: number;
  averageMinutesPerGame: number;
  averageMinutesPerDay: number;
}

export interface RoleRecord {
  role: PlayerRole;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface IdentityFavorite {
  role: PlayerRole;
  identity: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface LongestGame {
  turnCount: number;
  role: PlayerRole;
  opponent: string | null;
  opponentIdentity: string | null;
  completedAt: Date | null;
  result: "win" | "loss" | "draw";
}

export interface FrequentOpponent {
  username: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface LongestDurationGame {
  minutes: number;
  role: PlayerRole;
  opponent: string | null;
  completedAt: Date | null;
  result: "win" | "loss" | "draw";
}

export interface DayActivityStat {
  date: Date;
  games: number;
}

export interface LongestStreak {
  days: number;
  start: Date;
  end: Date;
}

export interface LongestDrought {
  days: number;
  start: Date;
  end: Date;
}

export interface GameHighlight {
  role: PlayerRole;
  value: number;
  identity: string | null;
  opponent: string | null;
  opponentIdentity: string | null;
  completedAt: Date | null;
  turnCount: number | null;
}

export interface Highlights {
  mostShuffles: GameHighlight | null;
  mostShufflesRunner: GameHighlight | null;
  mostShufflesCorp: GameHighlight | null;
  mostClicksPerTurn: GameHighlight | null;
  mostClicksPerTurnCorp: GameHighlight | null;
  leastClicksPerTurn: GameHighlight | null;
  mostCreditsPerTurn: GameHighlight | null;
  mostCreditsPerTurnCorp: GameHighlight | null;
  leastCreditsPerTurn: GameHighlight | null;
  mostCardsPlayed: GameHighlight | null;
  mostCardsPlayedRunner: GameHighlight | null;
  mostCardsPlayedCorp: GameHighlight | null;
  mostCardsRezzed: GameHighlight | null;
  mostRuns: GameHighlight | null;
  mostRunsPerClick: GameHighlight | null;
  mostDamage: GameHighlight | null;
  mostDamageTaken: GameHighlight | null;
  mostDamageTakenWin: GameHighlight | null;
  mostFakeCredits: GameHighlight | null;
  mostFakeCreditsPerTurn: GameHighlight | null;
  leastUniqueAccessesAgendaWin: GameHighlight | null;
  fewestCardsRezzedCorpWin: GameHighlight | null;
  mostTagsTaken: GameHighlight | null;
  leastRunsInWin: GameHighlight | null;
  fastestFlatlineWin: GameHighlight | null;
  fastestAgendaWin: GameHighlight | null;
  leastCreditsSpentWin: GameHighlight | null;
}

export interface ReasonSummary {
  reason: string;
  count: number;
  total: number;
  percent: number;
}

export interface WinLossReasons {
  wins: ReasonSummary | null;
  losses: ReasonSummary | null;
}
