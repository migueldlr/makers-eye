"use client";

import { idToFaction, shortenId } from "@/lib/util";
import {
  Stack,
  Title,
  Table,
  TableThead,
  TableTr,
  TableTh,
  Text,
  Center,
  TableTbody,
  TableTd,
  Overlay,
  Group,
  Code,
  ActionIcon,
  Switch,
  NumberInput,
} from "@mantine/core";
import { IconTransfer } from "@tabler/icons-react";
import { getMatchesMetadata, getWinrates } from "./actions";
import { useEffect, useMemo, useState } from "react";

function FillerTd({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableTd key={i}></TableTd>
      ))}
    </>
  );
}

const HOVER_STYLE = {
  backgroundColor: "rgba(0,0,0,0.3)",
};

export default function MatchupTable() {
  const [winrates, setWinrates] = useState<
    Awaited<ReturnType<typeof getWinrates>> | undefined
  >();
  const [metadata, setMetadata] = useState<
    Awaited<ReturnType<typeof getMatchesMetadata>> | undefined
  >();

  const [mainSide, setMainSide] = useState<"runner" | "corp">("runner");
  const offSide = mainSide === "runner" ? "corp" : "runner";
  const [groupByFaction, setGroupByFaction] = useState(true);
  const [showColors, setShowColors] = useState(true);
  const [showPercentages, setShowPercentages] = useState(false);
  const [hoveredCoords, setHoveredCoords] = useState<{
    row: number;
    col: number;
  }>({
    row: -1,
    col: -1,
  });

  const [minMatches, setMinMatches] = useState(1);

  useEffect(() => {
    (async () => {
      const winrates = await getWinrates(minMatches);
      const metadata = await getMatchesMetadata();
      setWinrates(winrates);
      setMetadata(metadata);
    })();
  }, [minMatches]);

  const countsToIds = (_?: { identity: string; player_count: number }[]) =>
    _?.map(({ identity }) => identity);

  const sortByFaction = (l: string, r: string) => {
    const a = idToFaction(l);
    const b = idToFaction(r);
    return a < b ? -1 : a > b ? 1 : 0;
  };

  const sortByPopularity =
    (side: "runner" | "corp") => (l: string, r: string) => {
      if (metadata == null) {
        return 0;
      }
      const popularityData =
        side === "runner" ? metadata.runnerData : metadata.corpData;
      const a =
        popularityData.find(({ identity }) => identity === r)?.player_count ??
        0;
      const b =
        popularityData.find(({ identity }) => identity === l)?.player_count ??
        0;
      return a < b ? -1 : a > b ? 1 : 0;
    };

  const { allSideOneIds, allSideTwoIds } = useMemo(() => {
    if (metadata == null) {
      return {
        allSideOneIds: [],
        allSideTwoIds: [],
      };
    }
    const allSideOneIds =
      (mainSide === "corp"
        ? countsToIds(metadata.corpData)
        : countsToIds(metadata.runnerData)) ?? [];
    const allSideTwoIds =
      (mainSide === "corp"
        ? countsToIds(metadata.runnerData)
        : countsToIds(metadata.corpData)) ?? [];
    allSideOneIds.sort(sortByPopularity(mainSide)); //.sort(sortByFaction);
    allSideTwoIds.sort(sortByPopularity(offSide)); //.sort(sortByFaction);
    if (groupByFaction) {
      allSideOneIds.sort(sortByFaction);
      allSideTwoIds.sort(sortByFaction);
    }
    return {
      allSideOneIds,
      allSideTwoIds,
    };
  }, [mainSide, metadata, groupByFaction]);

  if (winrates == null) {
    return <div>Loading...</div>;
  }

  function switchSides() {
    setMainSide((prev) => (prev === "runner" ? "corp" : "runner"));
  }

  const controls = (
    <Group justify="end">
      <Switch
        checked={showColors}
        onChange={(e) => setShowColors(e.currentTarget.checked)}
        label="Show colors"
      />
      <Switch
        checked={groupByFaction}
        onChange={(e) => setGroupByFaction(e.currentTarget.checked)}
        label="Group by faction"
      />
      <Switch
        checked={showPercentages}
        onChange={(e) => setShowPercentages(e.currentTarget.checked)}
        label="Show percentages"
      />{" "}
      <NumberInput
        w={100}
        value={minMatches}
        onChange={(val) => setMinMatches(Number(val))}
        min={1}
        label="Min matches"
      />
      <Group gap="xs">
        <ActionIcon variant="default" onClick={() => switchSides()}>
          <IconTransfer style={{ width: "50%", height: "50%" }} />
        </ActionIcon>
        <Text style={{ alignSelf: "baseline" }}>
          <Code>{mainSide} wins</Code>-
          <Code>{mainSide === "runner" ? "corp" : "runner"} wins</Code>
        </Text>
      </Group>
    </Group>
  );

  return (
    <Stack gap="xl" pb="xl">
      <Title order={3} id="matchups">
        Matchup spread
      </Title>
      <Table>
        <TableThead>
          <TableTr>
            <FillerTd count={2} />
            {allSideTwoIds.filter(Boolean).map((sideTwoId, i) => {
              return (
                <TableTh
                  key={sideTwoId}
                  style={{
                    cursor: "default",
                    ...(i === hoveredCoords.col && HOVER_STYLE),
                  }}
                >
                  <Center>
                    <Text style={{ writingMode: "sideways-lr" }}>
                      {shortenId(sideTwoId)}
                    </Text>
                  </Center>
                </TableTh>
              );
            })}
          </TableTr>
        </TableThead>
        <TableTbody>
          <TableTr>
            <FillerTd count={2} />
            {allSideTwoIds.filter(Boolean).map((sideTwoId) => {
              const gamesWithSideTwoId = winrates.filter(
                (winrate) =>
                  winrate.corp_identity === sideTwoId ||
                  winrate.runner_identity === sideTwoId
              );
              const runnerWins = gamesWithSideTwoId.reduce((acc, winrate) => {
                return acc + winrate.runner_wins;
              }, 0);
              const corpWins = gamesWithSideTwoId.reduce((acc, winrate) => {
                return acc + winrate.corp_wins;
              }, 0);
              const [sideOneWins, sideTwoWins] =
                mainSide === "runner"
                  ? [runnerWins, corpWins]
                  : [corpWins, runnerWins];
              return (
                <TableTd key={sideTwoId} style={{ cursor: "default" }}>
                  {showPercentages
                    ? `${Math.round(
                        (sideOneWins / (sideOneWins + sideTwoWins)) * 100
                      )}%`
                    : `${sideOneWins}-${sideTwoWins}`}
                </TableTd>
              );
            })}
          </TableTr>
          {allSideOneIds.filter(Boolean).map((sideOneId, i) => {
            const gamesWithSideOneId = winrates.filter((winrate) => {
              return (
                winrate.corp_identity === sideOneId ||
                winrate.runner_identity === sideOneId
              );
            });
            const runnerWins = gamesWithSideOneId.reduce((acc, winrate) => {
              return acc + winrate.runner_wins;
            }, 0);
            const corpWins = gamesWithSideOneId.reduce((acc, winrate) => {
              return acc + winrate.corp_wins;
            }, 0);

            const [sideOneWins, sideTwoWins] =
              mainSide === "runner"
                ? [runnerWins, corpWins]
                : [corpWins, runnerWins];

            return (
              <TableTr key={sideOneId}>
                <TableTd
                  style={{
                    cursor: "default",
                    ...(i === hoveredCoords.row && HOVER_STYLE),
                  }}
                >
                  <Text>{shortenId(sideOneId)}</Text>
                </TableTd>
                <TableTd style={{ cursor: "default" }}>
                  {showPercentages
                    ? `${Math.round(
                        (sideOneWins / (sideOneWins + sideTwoWins)) * 100
                      )}%`
                    : `${sideOneWins}-${sideTwoWins}`}{" "}
                </TableTd>
                {allSideTwoIds.filter(Boolean).map((sideTwoId, j) => {
                  const games = gamesWithSideOneId.filter(
                    (game) =>
                      game.corp_identity === sideTwoId ||
                      game.runner_identity === sideTwoId
                  );
                  const runnerWins = games.reduce((acc, game) => {
                    return acc + game.runner_wins;
                  }, 0);
                  const corpWins = games.reduce((acc, game) => {
                    return acc + game.corp_wins;
                  }, 0);
                  const draws = games.reduce((acc, game) => {
                    return acc + game.draws;
                  }, 0);

                  const [sideOneWins, sideTwoWins] =
                    mainSide === "runner"
                      ? [runnerWins, corpWins]
                      : [corpWins, runnerWins];

                  const hovered =
                    hoveredCoords.row === i && hoveredCoords.col === j;

                  const hasResults = sideOneWins + sideTwoWins > 0;
                  const isBlowout = sideOneWins === 0 || sideTwoWins === 0;

                  const percentageDisplay = hasResults
                    ? `${Math.round(
                        (sideOneWins / (sideOneWins + sideTwoWins)) * 100
                      )}%`
                    : "-";

                  const rawWr = sideOneWins / (sideOneWins + sideTwoWins);

                  return (
                    <TableTd
                      key={sideTwoId}
                      pos="relative"
                      onMouseOver={() => {
                        games.length > 0 &&
                          setHoveredCoords({ row: i, col: j });
                      }}
                      onMouseLeave={() => {
                        setHoveredCoords({ row: -1, col: -1 });
                      }}
                      style={{
                        cursor: "default",
                        ...(showColors &&
                          hasResults && {
                            backgroundColor: `color-mix(in oklab, #071d31 ${
                              (1 - rawWr) * 100
                            }%, #1864ab ${rawWr * 100}%)`, //lighten("#580e0e", rawWr * 0.7),
                          }),
                        ...(games.length !== 0 && hovered && HOVER_STYLE),
                      }}
                    >
                      {games.length === 0 ? (
                        <Overlay backgroundOpacity={0} />
                      ) : (
                        <Text size="sm">
                          {showPercentages
                            ? percentageDisplay
                            : `${sideOneWins}-${sideTwoWins}`}
                        </Text>
                      )}
                    </TableTd>
                  );
                })}
              </TableTr>
            );
          })}
        </TableTbody>
      </Table>
      {controls}
    </Stack>
  );
}
