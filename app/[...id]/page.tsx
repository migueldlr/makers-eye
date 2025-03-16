import { Game, Player, Tournament, SwissGameResult } from "../lib/types";

function getGameResult(game: Game): "corpWin" | "runnerWin" | "draw" {
  const { player1, player2 } = game;
  if (
    (player1?.role === "runner" &&
      (player1 as SwissGameResult).runnerScore === 3) ||
    (player2?.role === "runner" &&
      (player2 as SwissGameResult).runnerScore === 3)
  ) {
    return "runnerWin";
  }

  if (
    (player1?.role === "corp" &&
      (player1 as SwissGameResult).corpScore === 3) ||
    (player2?.role === "corp" && (player2 as SwissGameResult).corpScore === 3)
  ) {
    return "corpWin";
  }

  return "draw";
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const urls = {
    cobra: `https://tournaments.nullsignal.games/tournaments/`,
    aesops: `https://www.aesopstables.net/`,
  };
  const site = id[0] as keyof typeof urls;

  const data = await fetch(`${urls[site]}${id[1]}.json`);
  const tournament = (await data.json()) as Tournament;

  const playerMap: Record<number, Player> = {};
  tournament.players?.forEach((player) => {
    if (!player.id) return;
    playerMap[player.id] = player;
  });

  const rounds_augmented = tournament.rounds?.map((round) =>
    round.map((game) => {
      const player1 = playerMap[game.player1?.id ?? 0];
      const player2 = playerMap[game.player2?.id ?? 0];

      const result = getGameResult(game);

      return {
        ...game,
        result,
        runner: game.player1?.role === "runner" ? player1 : player2,
        corp: game.player1?.role === "corp" ? player1 : player2,
      };
    })
  );

  return (
    <div>
      <pre>{JSON.stringify(tournament.players, null, 2)}</pre>
    </div>
  );
}
