"use client";

import { Player, Tournament } from "../lib/types";
import {
  Flex,
  Text,
  TextInput,
  Card,
  Stack,
  SimpleGrid,
  Code,
  Tooltip,
  Title,
  Group,
} from "@mantine/core";
import { forwardRef, memo, Ref, useMemo, useRef, useState } from "react";
import {
  AugmentedGame,
  AugmentedRound,
  getIfPlayerWon,
  getIfPlayerWonDss,
  getPlayerSide,
  isDss,
  playerInGame,
  PlayerResult,
} from "../lib/tournament";
import { shortenId } from "../lib/util";

function SideRow({
  games,
  player,
  side,
  playerMap,
}: {
  player: Player;
  games: (AugmentedGame | null)[];
  side: "runner" | "corp";
  playerMap: Record<number, Player>;
}) {
  const numRounds = Math.max(
    Math.max(...games.map((game) => game?.round ?? 0)),
    0
  );

  return (
    <>
      {[...new Array(numRounds)].map((_, i) => {
        const game = games.find((game) => game?.round === i + 1);
        if (!game) return <div key={i}></div>;
        let { player1, player2 } = game;

        if (player2?.id === player.id) {
          player1 = game.player2;
          player2 = game.player1;
        }

        const dss = isDss(game);

        const playerResult = !dss
          ? getIfPlayerWon(player, game)
          : getIfPlayerWonDss(player, game, side);

        if (!dss) {
          const playerSide = getPlayerSide(player, game);

          if (playerSide !== side) return <div key={i}></div>;
        }

        const playerIdentity = shortenId(
          side === "runner" ? player.runnerIdentity : player.corpIdentity
        );
        const enemy = playerMap[player2?.id ?? 0] ?? null;
        const enemyIdentity = shortenId(
          side === "runner" ? enemy?.corpIdentity : enemy?.runnerIdentity
        );

        const label = `R${game.round} ${
          playerResult === "win"
            ? "Win"
            : playerResult === "loss"
            ? "Loss"
            : playerResult === "bye"
            ? "Bye"
            : playerResult === "draw"
            ? "Draw"
            : "Unknown"
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

export const WinLossDraw = ({
  result,
  ref,
}: {
  result: PlayerResult;
  ref?: Ref<HTMLDivElement>;
}) => {
  return (
    <div style={{ cursor: "pointer" }} ref={ref}>
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
};

function TitleWithMatch({
  text,
  query,
  enabled,
}: {
  text: string;
  query: string;
  enabled: boolean;
}) {
  if (query.length === 0 || !enabled) {
    return <Title order={4}>{text}</Title>;
  }
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <Title order={4}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <b key={i}>{part}</b>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </Title>
  );
}

function PlayerCard_raw(
  {
    player,
    games,
    playerMap,
    query,
  }: {
    player: Player;
    games: (AugmentedGame | null)[];
    playerMap: Record<number, Player>;
    query: string;
  },
  ref: Ref<HTMLDivElement>
) {
  const numRounds = Math.max(...games.map((game) => game?.round ?? 0));
  return (
    <Card key={player.id} p="sm" withBorder={true} ref={ref}>
      <Stack gap="xs">
        <TitleWithMatch
          text={`${player.rank}. ${player.name}`}
          query={query}
          enabled={query.length > 0}
        />
        <Group align="start">
          <Stack gap="xs" w="5em">
            <Text ta="right">{shortenId(player.corpIdentity)}</Text>
            <Text ta="right">{shortenId(player.runnerIdentity)}</Text>
          </Stack>
          <SimpleGrid
            cols={numRounds}
            w="fit-content"
            spacing="xs"
            verticalSpacing="xs"
          >
            <SideRow
              player={player}
              games={games}
              side="corp"
              playerMap={playerMap}
            />

            <SideRow
              player={player}
              games={games}
              side="runner"
              playerMap={playerMap}
            />
          </SimpleGrid>
        </Group>
      </Stack>
    </Card>
  );
}
const PlayerCard = memo(forwardRef(PlayerCard_raw));

export function Players({
  tournament,
  roundsAugmented,
  playerMap,
}: {
  tournament: Tournament;
  roundsAugmented: AugmentedRound[];
  playerMap: Record<number, Player>;
}) {
  const [playerFilter, setPlayerFilter] = useState("");

  const roundsPerPlayer = useMemo(() => {
    const out: Record<number, AugmentedRound[]> = {};
    for (const player of tournament?.players ?? []) {
      if (!player.id) continue;
      out[player.id] = roundsAugmented.filter((round) =>
        round.some((game) => playerInGame(game, player))
      );
    }
    return out;
  }, [tournament, roundsAugmented]);

  const gamesPerPlayer = useMemo(() => {
    const out: Record<number, (AugmentedGame | null)[]> = {};
    for (const player of tournament?.players ?? []) {
      if (!player.id) continue;

      const rounds = roundsAugmented.filter((round) =>
        round.some((game) => playerInGame(game, player))
      );
      const games = rounds.map((round) => {
        return round.find((game) => playerInGame(game, player)) ?? null;
      });
      out[player.id] = games;
    }
    return out;
  }, [tournament, roundsAugmented]);

  const searchInput = (
    <Flex>
      <TextInput
        value={playerFilter}
        onChange={(e) => {
          setPlayerFilter(e.target.value);
        }}
        placeholder="Search player name"
      />
    </Flex>
  );

  return (
    <>
      <Title order={4} id="players">
        Players
      </Title>
      {searchInput}
      {tournament.players
        ?.filter(
          (player) =>
            playerFilter.length === 0 ||
            player.name?.toLowerCase().includes(playerFilter)
        )
        .map((player) => {
          const rounds = roundsPerPlayer[player?.id ?? 0];

          const games = gamesPerPlayer[player?.id ?? 0];

          return (
            <PlayerCard
              key={player.id}
              player={player}
              games={games}
              playerMap={playerMap}
              query={playerFilter}
            />
          );
        })}
    </>
  );
}
