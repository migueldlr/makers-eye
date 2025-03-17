import {
  AesopsEliminationGame,
  AesopsGame,
  AesopsSwissGame,
  CobraGame,
  EliminationGameResult,
  Game,
  Player,
  Round,
  SwissGameResult,
  Tournament,
} from "../lib/types";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Code,
  Container,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { shortenId } from "../lib/util";

type Result = "corpWin" | "runnerWin" | "draw";
type PlayerResult = "win" | "loss" | "draw" | "bye";

type AugmentedRound = (CobraGame & {
  runner: Player;
  corp: Player;
  result: Result;
})[];

function getGameResult(game: CobraGame): Result {
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

function getIfPlayerWon(player: Player, game: CobraGame): PlayerResult {
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

function getPlayerSide(player: Player, game: CobraGame): "runner" | "corp" {
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

function WinLossDraw({ result }: { result: PlayerResult }) {
  return (
    <div style={{ cursor: "pointer" }}>
      {result === "win" ? (
        <Code c="#2bdd66">W</Code>
      ) : result === "loss" ? (
        <Code c="#f21616">L</Code>
      ) : result === "draw" ? (
        <Code>D</Code>
      ) : result === "bye" ? (
        <Code c="#2bdd66">B</Code>
      ) : (
        <Code>?</Code>
      )}
    </div>
  );
}

function playerInGame(game: CobraGame, player: Player) {
  return game.player1?.id === player.id || game.player2?.id === player.id;
}

function aesopsGameToCobraGame(game: AesopsGame): CobraGame {
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

function SideRow({
  rounds,
  player,
  side,
  playerMap,
}: {
  player: Player;
  rounds?: AugmentedRound[];
  side: "runner" | "corp";
  playerMap: Record<number, Player>;
}) {
  return (
    <>
      {rounds?.map((round, i) => {
        const game = round.find((game) => {
          return playerInGame(game, player);
        });

        if (!game) return null;

        let { player1, player2 } = game;

        if (player2?.id === player.id) {
          player1 = game.player2;
          player2 = game.player1;
        }

        // const result = getGameResult(game);
        const playerResult = getIfPlayerWon(player, game);
        const playerSide = getPlayerSide(player, game);

        if (playerSide !== side) return <div key={i}></div>;

        const playerIdentity = shortenId(
          side === "runner" ? player.runnerIdentity : player.corpIdentity
        );
        const enemy = playerMap[player2?.id ?? 0] ?? null;
        const enemyIdentity = shortenId(
          side === "runner" ? enemy?.corpIdentity : enemy?.runnerIdentity
        );

        const label = `R${i + 1} ${
          playerResult === "win"
            ? "Win"
            : playerResult === "loss"
            ? "Loss"
            : playerResult === "bye"
            ? "Bye"
            : "Draw"
        }: ${playerIdentity} vs ${enemyIdentity} (${enemy?.name ?? "unknown"})`;

        return (
          <Tooltip key={i} label={label}>
            <WinLossDraw result={playerResult} />
          </Tooltip>
        );
      })}
    </>
  );
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
  const isAesops = site === "aesops";

  const data = await fetch(`${urls[site]}${id[1]}.json`);
  const tournament = (await data.json()) as Tournament;

  const playerMap: Record<number, Player> = {};
  tournament.players?.forEach((player) => {
    if (!player.id) return;
    playerMap[player.id] = player;
  });

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

  console.log(rounds_augmented);

  const allIds = tournament.players?.map((player) => `${player.id}`) || [];

  return (
    <Container>
      <Accordion multiple defaultValue={allIds}>
        {tournament.players?.map((player) => {
          const numRounds = rounds_augmented.filter((round) =>
            round.some((game) => playerInGame(game, player))
          ).length;
          return (
            <AccordionItem key={player.id} value={`${player.id}`}>
              <AccordionControl>
                {player.rank} {player.name}
              </AccordionControl>
              <AccordionPanel>
                <SimpleGrid
                  cols={numRounds}
                  w="fit-content"
                  spacing="xs"
                  verticalSpacing="xs"
                >
                  <SideRow
                    player={player}
                    rounds={rounds_augmented}
                    side="runner"
                    playerMap={playerMap}
                  />
                  <SideRow
                    player={player}
                    rounds={rounds_augmented}
                    side="corp"
                    playerMap={playerMap}
                  />
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Container>
  );
}
