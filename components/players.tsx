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
  Affix,
  ActionIcon,
  Transition,
  Group,
  Title,
} from "@mantine/core";
import {
  forwardRef,
  memo,
  Ref,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AugmentedGame,
  AugmentedRound,
  augmentRounds,
  createPlayerMap,
  getIfPlayerWon,
  getPlayerSide,
  playerInGame,
  PlayerResult,
} from "../lib/tournament";
import { shortenId } from "../lib/util";
import {
  IconArrowDown,
  IconArrowsUp,
  IconArrowUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { useScrollIntoView, useWindowScroll } from "@mantine/hooks";

function SideRow({
  games,
  player,
  side,
  playerMap,
}: {
  player: Player;
  games?: (AugmentedGame | null)[];
  side: "runner" | "corp";
  playerMap: Record<number, Player>;
}) {
  return (
    <>
      {games?.map((game, i) => {
        if (!game) return <div key={i}></div>;
        let { player1, player2 } = game;

        if (player2?.id === player.id) {
          player1 = game.player2;
          player2 = game.player1;
        }

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
    <Title>
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
    rounds,
    games,
    playerMap,
    selected,
    query,
  }: {
    player: Player;
    rounds: AugmentedRound[];
    games: (AugmentedGame | null)[];
    playerMap: Record<number, Player>;
    selected: boolean;
    query: string;
  },
  ref: Ref<HTMLDivElement>
) {
  return (
    <Card
      key={player.id}
      p="sm"
      withBorder={true}
      style={{
        ...(selected
          ? { borderColor: "orange" }
          : { borderColor: "transparent" }),
      }}
      ref={ref}
    >
      <Stack gap="xs">
        <TitleWithMatch
          text={`${player.rank}. ${player.name}`}
          query={query}
          enabled={selected}
        />
        <Text>
          {shortenId(player.corpIdentity)} + {shortenId(player.runnerIdentity)}
        </Text>
        <SimpleGrid
          cols={rounds.length}
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
      </Stack>
    </Card>
  );
}
const PlayerCard = memo(forwardRef(PlayerCard_raw));

const FANCY_SEARCH_ENABLED = false;

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
  const [index, setIndex] = useState(-1);
  const [_scroll, scrollTo] = useWindowScroll();
  const targetRef = useRef<HTMLDivElement>(null);

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

  const selectedPlayers = useMemo(
    () =>
      tournament.players?.map(
        (player) =>
          playerFilter.length === 0 ||
          (player?.name ?? "")
            .toLowerCase()
            .includes(playerFilter.toLowerCase())
      ) ?? [],
    [tournament, playerFilter]
  );

  const scrollNext = useCallback(() => {
    let newIndex = index;
    for (let i = 1; i < selectedPlayers.length + 1; i++) {
      const currIndex = (index + i) % selectedPlayers.length;
      if (selectedPlayers[currIndex]) {
        newIndex = currIndex;
        break;
      }
    }
    setIndex(newIndex);
    setTimeout(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 10);
  }, [index, selectedPlayers]);

  const scrollToTop = () => {
    setIndex(-1);
    scrollTo({ y: 0 });
  };

  const searchHelper = (
    <Affix position={{ bottom: 20, right: 20 }}>
      <Transition transition="slide-left" mounted={playerFilter.length > 0}>
        {(transitionStyles) => (
          <Stack style={transitionStyles} gap="sm">
            <ActionIcon variant="default" size={40} onClick={scrollToTop}>
              <IconArrowsUp size={20} />
            </ActionIcon>
            <ActionIcon variant="default" size={40} onClick={scrollNext}>
              <IconArrowDown size={20} />
            </ActionIcon>
          </Stack>
        )}
      </Transition>
    </Affix>
  );
  const searchInput = (
    <Flex>
      <TextInput
        value={playerFilter}
        onChange={(e) => {
          setPlayerFilter(e.target.value);
          setIndex(-1);
        }}
        placeholder="Player name"
      />
    </Flex>
  );

  return (
    <>
      <Title order={4} id="players">
        Players
      </Title>
      {FANCY_SEARCH_ENABLED ? searchHelper : null}
      {FANCY_SEARCH_ENABLED ? searchInput : null}
      {tournament.players?.map((player, i) => {
        const rounds = roundsPerPlayer[player?.id ?? 0];
        const games = gamesPerPlayer[player?.id ?? 0];
        return (
          <PlayerCard
            key={player.id}
            player={player}
            rounds={rounds ?? []}
            games={games}
            playerMap={playerMap}
            selected={i === index}
            ref={i === index ? targetRef : null}
            query={playerFilter}
          />
        );
      })}
    </>
  );
}
