import {
  CobraGame,
  Player,
  SwissGameResult,
  EliminationGameResult,
  AesopsGame,
  Tournament,
} from "./types";

export type Result = "corpWin" | "runnerWin" | "draw";
export type PlayerResult = "win" | "loss" | "draw" | "bye";

export type AugmentedGame = CobraGame & {
  runner: Player;
  corp: Player;
  result: Result;
};

export type AugmentedRound = AugmentedGame[];

export function getGameResult(game: CobraGame): Result {
  const { player1, player2 } = game;
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
  if (player2?.id == null) return "bye";
  if (
    player1?.id === player.id &&
    (player1?.combinedScore === 3 || player1?.winner)
  )
    return "win";

  return "loss";
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

export function augmentRounds(
  tournament: Tournament,
  isAesops: boolean,
  playerMap: Record<number, Player>
) {
  const rounds_augmented: AugmentedRound[] =
    tournament.rounds?.map((round) =>
      round.map((rawGame) => {
        const game = isAesops
          ? aesopsGameToCobraGame(rawGame)
          : (rawGame as CobraGame);
        const result = getGameResult(game);

        const player1 = playerMap[game.player1?.id ?? 0];
        const player2 = playerMap[game.player2?.id ?? 0];

        const out = {
          ...game,
          result,
          runner: game.player1?.role === "runner" ? player1 : player2,
          corp: game.player1?.role === "corp" ? player1 : player2,
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
