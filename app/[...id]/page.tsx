import {
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

interface AugmentedGame extends Game {
  result: "corpWin" | "runnerWin" | "draw";
  runner: Player;
  corp: Player;
}

function getGameResult(game: Game): "corpWin" | "runnerWin" | "draw" {
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

function getIfPlayerWon(player: Player, game: Game): "win" | "loss" | "draw" {
  let result: "win" | "loss" | "draw" = "loss";
  if (game.intentionalDraw || game.player1?.combinedScore === 1)
    result = "draw";
  if (
    (game.player1?.id === player.id &&
      (game.player1?.combinedScore === 3 || game.player1?.winner)) ||
    (game.player2?.id === player.id &&
      (game.player2?.combinedScore === 3 || game.player2?.winner))
  )
    result = "win";

  return result;
}

function getPlayerSide(player: Player, game: Game): "runner" | "corp" {
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

function WinLossDraw({ player, game }: { player: Player; game?: Game }) {
  if (game == null)
    return (
      <div>
        <Code>-</Code>
      </div>
    );
  let result = "loss";
  if (game.intentionalDraw || game.player1?.combinedScore === 1)
    result = "draw";
  if (
    (game.player1?.id === player.id &&
      (game.player1?.combinedScore === 3 || game.player1?.winner)) ||
    (game.player2?.id === player.id &&
      (game.player2?.combinedScore === 3 || game.player2?.winner))
  )
    result = "win";

  return (
    <div>
      {result === "win" ? (
        <Code c="#2bdd66">W</Code>
      ) : result === "loss" ? (
        <Code c="#f21616">L</Code>
      ) : result === "draw" ? (
        <Code>D</Code>
      ) : (
        <Code>?</Code>
      )}
    </div>
  );
}

function SideRow({
  rounds,
  player,
  side,
  playerMap,
}: {
  player: Player;
  rounds?: AugmentedGame[][];
  side: "runner" | "corp";
  playerMap: Record<number, Player>;
}) {
  return (
    <>
      {rounds?.map((round, i) => {
        const game = round.find((game) => {
          return (
            game.player1?.id === player.id || game.player2?.id === player.id
          );
        });

        if (!game) return null;

        let { player1, player2 } = game;

        if (player2?.id === player.id) {
          player1 = game.player2;
          player2 = game.player1;
        }

        const result = getGameResult(game);
        const playerResult = getIfPlayerWon(player, game);
        const playerSide = getPlayerSide(player, game);

        if (playerSide !== side) return <div></div>;

        return (
          <Tooltip key={i} label={`${result} ${side}`}>
            <WinLossDraw key={i} game={game} player={player} />
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

  const data = await fetch(`${urls[site]}${id[1]}.json`);
  const tournament = (await data.json()) as Tournament;

  const playerMap: Record<number, Player> = {};
  tournament.players?.forEach((player) => {
    if (!player.id) return;
    playerMap[player.id] = player;
  });

  const rounds_augmented: AugmentedGame[][] =
    tournament.rounds?.map((round) =>
      round.map((game) => {
        const player1 = playerMap[game.player1?.id ?? 0];
        const player2 = playerMap[game.player2?.id ?? 0];

        const result = getGameResult(game);

        const addedData = {
          result,
          runner: game.player1?.role === "runner" ? player1 : player2,
          corp: game.player1?.role === "corp" ? player1 : player2,
        };

        const out: AugmentedGame = {
          ...game,
          ...addedData,
        };

        return out;
      })
    ) || [];

  return (
    <Container>
      <Accordion multiple>
        {tournament.players?.map((player) => {
          return (
            <AccordionItem key={player.id} value={`${player.id}`}>
              <AccordionControl>
                {player.rank} {player.name}
              </AccordionControl>
              <AccordionPanel>
                <SimpleGrid
                  cols={
                    rounds_augmented.filter((round) =>
                      round.some(
                        (game) =>
                          game.player1?.id === player.id ||
                          game.player2?.id === player.id
                      )
                    ).length
                  }
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
