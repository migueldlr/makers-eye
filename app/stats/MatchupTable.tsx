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
  Group,
  Code,
  ActionIcon,
  Switch,
  NumberInput,
} from "@mantine/core";
import { IconTransfer } from "@tabler/icons-react";
import { getMatchesMetadata, getWinrates, WinrateData } from "./actions";
import { useEffect, useMemo, useState } from "react";
import Row from "./Row";
import FirstRow from "./FirstRow";

export function FillerTd({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableTd key={i}></TableTd>
      ))}
    </>
  );
}

export const HOVER_STYLE = {
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

  const [minMatches, setMinMatches] = useState(0);

  useEffect(() => {
    (async () => {
      const winrates = await getWinrates(1);
      const metadata = await getMatchesMetadata();
      setWinrates(winrates);
      setMetadata(metadata);
    })();
  }, []);

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
      {showColors && (
        <NumberInput
          w={100}
          value={minMatches}
          onChange={(val) => setMinMatches(Number(val))}
          min={0}
          label="Min matches"
        />
      )}
      <Switch
        checked={groupByFaction}
        onChange={(e) => setGroupByFaction(e.currentTarget.checked)}
        label="Group by faction"
      />
      <Switch
        checked={showPercentages}
        onChange={(e) => setShowPercentages(e.currentTarget.checked)}
        label="Show percentages"
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

  //   console.log(hoveredCoords);

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
          <FirstRow
            allSideTwoIds={allSideTwoIds}
            winrates={winrates}
            mainSide={mainSide}
            showPercentages={showPercentages}
          />
          {allSideOneIds.filter(Boolean).map((sideOneId, i) => (
            <Row
              key={sideOneId}
              sideOneId={sideOneId}
              allSideTwoIds={allSideTwoIds}
              winrates={winrates}
              mainSide={mainSide}
              showPercentages={showPercentages}
              showColors={showColors}
              hoveredCoords={hoveredCoords}
              setHoveredCoords={setHoveredCoords}
              i={i}
              minMatches={minMatches}
            />
          ))}
        </TableTbody>
      </Table>
      {controls}
    </Stack>
  );
}
