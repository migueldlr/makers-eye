import { it } from "node:test";
import {
  CobraGame,
  Player,
  SwissGameResult,
  EliminationGameResult,
  AesopsGame,
  Tournament,
} from "./types";
import {
  DEFAULT_UNKNOWN_ID,
  factionToColor,
  idToFaction,
  mergeObjects,
  shortenId,
} from "./util";
import { RawMatch, Standing, StandingResult } from "./localtypes";

export type Result = "corpWin" | "runnerWin" | "draw" | "bye" | "unknown";
export type PlayerResult = "win" | "loss" | "draw" | "bye" | "unknown";

export type AugmentedGame = CobraGame & {
  runner: Player;
  corp: Player;
  result: Result;
  round: number;
};

export type AugmentedRound = AugmentedGame[];

export function getGameResult(game: CobraGame): Result {
  const { player1, player2 } = game;

  if (
    (player1?.id as unknown as string) === "(BYE)" ||
    (player2?.id as unknown as string) === "(BYE)"
  ) {
    return "bye";
  }
  if (player1?.id == null || player2?.id == null) {
    return "bye";
  }

  if (
    (player1?.role === "runner" &&
      ((player1 as SwissGameResult).runnerScore === 3 ||
        (player1 as EliminationGameResult).winner)) ||
    (player2?.role === "runner" &&
      ((player2 as SwissGameResult).runnerScore === 3 ||
        (player2 as EliminationGameResult).winner))
  ) {
    return "runnerWin";
  }

  if (
    (player1?.role === "corp" &&
      ((player1 as SwissGameResult).corpScore === 3 ||
        (player1 as EliminationGameResult).winner)) ||
    (player2?.role === "corp" &&
      ((player2 as SwissGameResult).corpScore === 3 ||
        (player2 as EliminationGameResult).winner))
  ) {
    return "corpWin";
  }

  return "draw";
}

export function getIfPlayerWon(player: Player, game: CobraGame): PlayerResult {
  let { player1, player2 } = game;

  if (player2?.id === player.id) {
    player1 = game.player2;
    player2 = game.player1;
  }

  if (game.intentionalDraw || player1?.combinedScore === 1) return "draw";
  if (player2?.id == null || (player2.id as unknown as string) === "(BYE)")
    return "bye";
  if (
    player1?.id === player.id &&
    (player1?.combinedScore === 3 || player1?.winner)
  )
    return "win";

  return "loss";
}

export function getIfPlayerWonDss(
  player: Player,
  game: CobraGame,
  side: "runner" | "corp"
): PlayerResult {
  let { player1, player2 } = game;

  if (player2?.id === player.id) {
    player1 = game.player2;
    player2 = game.player1;
  }

  if (game.intentionalDraw) return "draw";
  if (player2?.id == null || (player2.id as unknown as string) === "(BYE)")
    return "bye";

  if (
    ((player1?.combinedScore as number) ?? 0) +
      ((player2?.combinedScore as number) ?? 0) <
    6
  ) {
    return "unknown";
  }
  if (side === "runner" && player1?.runnerScore === 3) return "win";
  if (side === "runner" && player1?.runnerScore === 0) return "loss";
  if (side === "corp" && player1?.corpScore === 3) return "win";
  if (side === "corp" && player1?.corpScore === 0) return "loss";

  if (side === "runner" && player1?.runnerScore === 3) return "win";
  if (side === "runner" && player1?.runnerScore === 0) return "loss";

  return "unknown";
}

export function getPlayerSide(
  player: Player,
  game: CobraGame
): "runner" | "corp" {
  let { player1, player2 } = game;

  if (player2?.id === player.id) {
    player1 = game.player2;
    player2 = game.player1;
  }

  if (player1?.role === "runner") return "runner";
  if (player1?.role === "corp") return "corp";

  if ((player1 as SwissGameResult).corpScore == null) return "runner";
  return "corp";
}

export function playerInGame(game: CobraGame, player: Player) {
  return game.player1?.id === player.id || game.player2?.id === player.id;
}

export function aesopsGameToCobraGame(game: AesopsGame): CobraGame {
  if (game.eliminationGame) {
    return {
      table: game.tableNumber,
      player1: {
        role: "corp",
        id: game.corpPlayer ?? 0,
        winner: game.winner_id === game.corpPlayer,
      },
      player2: {
        role: "runner",
        id: game.runnerPlayer ?? 0,
        winner: game.winner_id === game.runnerPlayer,
      },
      eliminationGame: true,
    };
  }
  return {
    table: game.tableNumber,
    player1: {
      id: game.corpPlayer ?? 0,
      role: "corp",
      runnerScore: null,
      corpScore: +(game.corpScore ?? 0),
      combinedScore: +(game.corpScore ?? 0),
    },
    player2: {
      id: game.runnerPlayer ?? 0,
      role: "runner",
      runnerScore: +(game.runnerScore ?? 0),
      corpScore: null,
      combinedScore: +(game.runnerScore ?? 0),
    },
    eliminationGame: false,
  };
}

export function isDss(game: CobraGame): boolean {
  return (
    ((game.player1?.combinedScore as number) ?? 0) +
      ((game.player2?.combinedScore as number) ?? 0) >
    3
  );
}

function getDssGameResult(
  game: CobraGame,
  runner: "player1" | "player2"
): Result {
  if (
    ((game.player1?.combinedScore as number) ?? 0) +
      ((game.player2?.combinedScore as number) ?? 0) <
    6
  ) {
    return "unknown";
  }
  if (game.player1?.id == null || game.player2?.id == null) return "bye";
  if (runner === "player1") {
    if (game.player1?.runnerScore === 3) return "runnerWin";
    if (game.player1?.runnerScore === 0) return "corpWin";
    return "draw";
  }
  if (game.player2?.runnerScore === 3) return "runnerWin";
  if (game.player2?.runnerScore === 0) return "corpWin";
  return "draw";
}

function parseDss(
  game: CobraGame,
  playerMap: Record<number, Player>,
  roundNumber: number
): AugmentedRound {
  const player1 = playerMap[game.player1?.id ?? 0];
  const player2 = playerMap[game.player2?.id ?? 0];

  // p1 runner, p2 corp
  const game1 = {
    ...game,
    result: getDssGameResult(game, "player1"),
    runner: player1,
    corp: player2,
    round: roundNumber + 1,
  };

  // p2 runner, p1 corp
  const game2 = {
    ...game,
    result: getDssGameResult(game, "player2"),
    runner: player2,
    corp: player1,
    round: roundNumber + 1,
  };

  return [game1, game2];
}

export function augmentRounds(
  tournament: Tournament,
  isAesops: boolean,
  playerMap: Record<number, Player>
) {
  const rounds_augmented: AugmentedRound[] =
    tournament.rounds?.map((round, roundNumber) =>
      round.flatMap((rawGame) => {
        const game = isAesops
          ? aesopsGameToCobraGame(rawGame)
          : (rawGame as CobraGame);
        if (isDss(game)) {
          const parsed = parseDss(game, playerMap, roundNumber);
          return parsed;
        }
        const result = getGameResult(game);

        const player1 = playerMap[game.player1?.id ?? 0];
        const player2 = playerMap[game.player2?.id ?? 0];

        const out: AugmentedGame = {
          ...game,
          result,
          runner: game.player1?.role === "runner" ? player1 : player2,
          corp: game.player1?.role === "corp" ? player1 : player2,
          round: roundNumber + 1,
        };

        return out;
      })
    ) || [];
  return rounds_augmented;
}

export function createPlayerMap(tournament: Tournament) {
  const playerMap: Record<number, Player> = {};
  tournament.players?.forEach((player) => {
    if (!player.id) return;
    playerMap[player.id] = player;
  });
  return playerMap;
}

export function groupGamesByRunner(games: AugmentedGame[]) {
  return games.reduce((acc, game) => {
    const runner = game.runner?.runnerIdentity ?? DEFAULT_UNKNOWN_ID;
    if (!acc[runner]) {
      acc[runner] = [];
    }
    acc[runner].push(game);
    return acc;
  }, {} as Record<string, AugmentedGame[]>);
}

export function groupRoundsByRunner(rounds: AugmentedRound[]) {
  const runnerToGames: Record<string, AugmentedGame[]> = {};
  return rounds.reduce((acc, round) => {
    return mergeObjects(acc, groupGamesByRunner(round));
  }, runnerToGames);
}

export function groupGamesByCorp(games: AugmentedGame[]) {
  return games.reduce((acc, game) => {
    const corp = game.corp?.corpIdentity ?? DEFAULT_UNKNOWN_ID;
    if (!acc[corp]) {
      acc[corp] = [];
    }
    acc[corp].push(game);
    return acc;
  }, {} as Record<string, AugmentedGame[]>);
}

export function groupPlayersByCorp(
  gamesByCorp: Record<string, AugmentedGame[]>
) {
  return Object.entries(gamesByCorp).reduce((acc, [corp, games]) => {
    const players = games.map((game) => game.corp);
    const uniquePlayers = Array.from(new Set(players));
    acc[corp] = uniquePlayers;
    return acc;
  }, {} as Record<string, Player[]>);
}

export function groupPlayersByRunner(
  gamesByRunner: Record<string, AugmentedGame[]>
) {
  return Object.entries(gamesByRunner).reduce((acc, [runner, games]) => {
    const players = games.map((game) => game.runner);
    const uniquePlayers = Array.from(new Set(players));
    acc[runner] = uniquePlayers;
    return acc;
  }, {} as Record<string, Player[]>);
}

export function groupPlayersByRunnerUsingPlayers(players: Player[]) {
  return players.reduce((acc, player) => {
    return mergeObjects(acc, {
      [player.runnerIdentity ?? DEFAULT_UNKNOWN_ID]: [player],
    });
  }, {} as Record<string, Player[]>);
}

export function groupPlayersByCorpUsingPlayers(players: Player[]) {
  return players.reduce((acc, player) => {
    return mergeObjects(acc, {
      [player.corpIdentity ?? DEFAULT_UNKNOWN_ID]: [player],
    });
  }, {} as Record<string, Player[]>);
}

export function groupRoundsByCorp(rounds: AugmentedRound[]) {
  const corpToGames: Record<string, AugmentedGame[]> = {};
  return rounds.reduce((acc, round) => {
    return mergeObjects(acc, groupGamesByCorp(round));
  }, corpToGames);
}

export function getUniqueCorps(rounds: AugmentedRound[]) {
  const corps = rounds.flatMap((round) =>
    round.map((game) => game.corp?.corpIdentity ?? DEFAULT_UNKNOWN_ID)
  );
  return Array.from(new Set(corps));
}

export function getUniqueRunners(rounds: AugmentedRound[]) {
  const runners = rounds.flatMap((round) =>
    round.map((game) => game.runner?.runnerIdentity ?? DEFAULT_UNKNOWN_ID)
  );
  return Array.from(new Set(runners));
}

export function winrateById(
  gamesById: Record<string, AugmentedGame[]>,
  playersById: Record<string, Player[]>,
  side: "runner" | "corp"
) {
  return Object.entries(gamesById)
    .sort(([a], [b]) => {
      return a < b ? -1 : a > b ? 1 : 0;
    })
    .sort(([a], [b]) => playersById[b].length - playersById[a].length)
    .map(([id, games]) => {
      if (games.every((game) => game.result === "bye")) return;
      const wins = games.filter(
        (game) =>
          (game.result === "corpWin" && side === "corp") ||
          (game.result === "runnerWin" && side === "runner")
      ).length;
      const losses = games.filter(
        (game) =>
          (game.result === "corpWin" && side === "runner") ||
          (game.result === "runnerWin" && side === "corp")
      ).length;
      return {
        id: shortenId(id),
        wins,
        losses,
        winrate: (wins / (wins + losses)) * 100,
        color: factionToColor(idToFaction(shortenId(id))),
        games: games.length,
      };
    })
    .filter(Boolean);
}

export function getCutPlayersByCorp(
  eliminationPlayers: Player[],
  players: Player[]
): Record<string, Player[]> {
  const cutPlayersById: Record<string, Player[]> = {};
  eliminationPlayers.forEach((eliminationPlayer) => {
    const player = players.find(
      (player) => player.id === eliminationPlayer.id
    )!;
    const corpId = player.corpIdentity ?? DEFAULT_UNKNOWN_ID;
    if (!cutPlayersById[corpId]) {
      cutPlayersById[corpId] = [];
    }
    cutPlayersById[corpId].push(player);
  });
  return cutPlayersById;
}

export function getCutPlayersByRunner(
  eliminationPlayers: Player[],
  players: Player[]
): Record<string, Player[]> {
  const cutPlayersById: Record<string, Player[]> = {};
  eliminationPlayers.forEach((eliminationPlayer) => {
    const player = players.find(
      (player) => player.id === eliminationPlayer.id
    )!;
    const runnerId = player.runnerIdentity ?? DEFAULT_UNKNOWN_ID;
    if (!cutPlayersById[runnerId]) {
      cutPlayersById[runnerId] = [];
    }
    cutPlayersById[runnerId].push(player);
  });
  return cutPlayersById;
}

export function cutConversionById(
  cutPlayers: Player[],
  players: Player[],
  side: "runner" | "corp"
) {
  const playersById =
    side === "corp"
      ? groupPlayersByCorpUsingPlayers(players)
      : groupPlayersByRunnerUsingPlayers(players);
  const cutPlayersById =
    side === "corp"
      ? getCutPlayersByCorp(cutPlayers, players)
      : getCutPlayersByRunner(cutPlayers, players);
  const baseline = cutPlayers.length / players.length;

  const out: {
    id: string;
    percentage: number;
    relative: number;
    color: string;
    cutPlayers: number;
    players: number;
  }[] = [];
  Object.entries(playersById).forEach(([id, players]) => {
    const percentage =
      (cutPlayersById[id] ?? []).length / playersById[id].length;
    out.push({
      id: shortenId(id),
      percentage,
      relative: percentage / baseline,
      color: factionToColor(idToFaction(shortenId(id))),
      cutPlayers: (cutPlayersById[id] ?? []).length,
      players: players.length,
    });
  });
  return out;
}

export function representationById(
  allPlayers: Player[],
  eliminationPlayers: Player[],
  side: "runner" | "corp",
  games: "cut" | "swiss"
) {
  const cutPlayersById =
    side === "corp"
      ? getCutPlayersByCorp(eliminationPlayers, allPlayers)
      : getCutPlayersByRunner(eliminationPlayers, allPlayers);
  const playersGroupedById =
    side === "corp"
      ? groupPlayersByCorpUsingPlayers(allPlayers ?? [])
      : groupPlayersByRunnerUsingPlayers(allPlayers ?? []);
  return Object.entries(
    games === "cut" ? cutPlayersById : playersGroupedById
  ).map(([id, players]) => {
    return {
      name: id,
      value: players.length,
      color: factionToColor(idToFaction(shortenId(id))),
      rawPlayers: players,
      percentage:
        players.length /
        (games === "cut" ? eliminationPlayers : allPlayers).length,
    };
  });
}

export function getWinLossDrawForPlayer(
  augmentedRounds: AugmentedRound[],
  player: Player,
  side: "runner" | "corp"
) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  augmentedRounds.forEach((round) => {
    round.map((game) => {
      if (game.result === "bye" || game.result === "unknown") {
        return;
      }
      if (side === "runner") {
        if (game.runner?.id === player.id) {
          if (game.result === "runnerWin") {
            wins++;
          } else if (game.result === "corpWin") {
            losses++;
          } else {
            draws++;
          }
        }
      } else {
        if (game.corp?.id === player.id) {
          if (game.result === "runnerWin") {
            losses++;
          } else if (game.result === "corpWin") {
            wins++;
          } else {
            draws++;
          }
        }
      }
    });
  });
  return { wins, losses, draws };
}

export function tournamentToStandings(
  tournament: Tournament,
  isAesops: boolean
): Omit<StandingResult, "tournament">[] {
  const playerMap = createPlayerMap(tournament);
  const roundsAugmented = augmentRounds(tournament, isAesops, playerMap);
  const standings: Omit<StandingResult, "tournament">[] = [];
  tournament.players?.map((player, swissRank) => {
    if (player.name == null) {
      console.error(`Player has no name: ${JSON.stringify(player)}`);
      return;
    }
    const corpResults = getWinLossDrawForPlayer(
      roundsAugmented,
      player,
      "corp"
    );
    const runnerResults = getWinLossDrawForPlayer(
      roundsAugmented,
      player,
      "runner"
    );
    const topCutIndex = tournament.eliminationPlayers?.findIndex(
      (eliminationPlayer) => eliminationPlayer.id === player.id
    );
    const topCutRank = topCutIndex !== undefined ? topCutIndex + 1 : undefined;
    const out: Omit<StandingResult, "tournament"> = {
      name: player.name,
      corpWins: corpResults.wins,
      corpLosses: corpResults.losses,
      corpDraws: corpResults.draws,
      runnerWins: runnerResults.wins,
      runnerLosses: runnerResults.losses,
      runnerDraws: runnerResults.draws,
      corpIdentity: player.corpIdentity ?? "",
      runnerIdentity: player.runnerIdentity ?? "",
      strengthOfSchedule: Number(player.strengthOfSchedule ?? 0),
      extendedStrengthOfSchedule: Number(
        player.extendedStrengthOfSchedule ?? 0
      ),
      matchPoints: player.matchPoints ?? 0,
      swissRank: swissRank + 1,
      topCutRank,
    };

    standings.push(out);
  });
  return standings;
}

export function tournamentToMatches(
  tournament: Tournament,
  isAesops: boolean,
  players: Standing[]
): RawMatch[] {
  const playerMap = createPlayerMap(tournament);
  const roundsAugmented = augmentRounds(tournament, isAesops, playerMap);
  const matches: RawMatch[] = [];

  roundsAugmented.forEach((round, i) => {
    const out = round.map((game) => {
      const match: RawMatch = {
        round: i + 1,
        corp_id:
          players.find((player) => player.name === game.corp?.name)?.id ?? null,
        runner_id:
          players.find((player) => player.name === game.runner?.name)?.id ??
          null,
        phase: game.eliminationGame ? "cut" : "swiss",
        result: game.result,
        table: game.table,
      };
      return match;
    });
    matches.push(...out);
  });

  return matches;
}
