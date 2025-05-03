"use client";

import { BarChart } from "@mantine/charts";

import {
  AugmentedRound,
  cutConversionById,
  groupGamesByCorp,
  groupGamesByRunner,
  groupPlayersByCorp,
  groupPlayersByRunner,
  groupRoundsByCorp,
  groupRoundsByRunner,
  winrateById,
} from "../../lib/tournament";
import { Checkbox, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Tournament } from "../../lib/types";
import { useState } from "react";

function ChartTooltip({
  label,
  payload,
  showWr,
  showCut,
}: {
  label: string;
  payload: Record<string, any>[] | undefined;
  showWr: boolean;
  showCut: boolean;
}) {
  if (!payload) return null;

  if (payload.length === 0) return null;

  const { winrate, games, relative, cutPlayers, players } = payload[0].payload;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        {label}
      </Text>
      {showWr ? (
        <>
          <Text>WR {winrate.toFixed(0)}%</Text>
          <Text>
            ({games} game{games > 1 ? "s" : ""})
          </Text>
        </>
      ) : null}
      {showCut ? (
        <>
          <Text>{Number(relative.toFixed(2))}x</Text>
          <Text>
            ({cutPlayers} of {players} player{players > 1 ? "s" : ""})
          </Text>
        </>
      ) : null}
    </Paper>
  );
}

function mergeData(
  wrData: ReturnType<typeof winrateById>,
  cutData: ReturnType<typeof cutConversionById>
) {
  return wrData.map((wrData) => {
    const cut = cutData.find(({ id: cutId }) => cutId === wrData?.id);
    return {
      ...wrData,
      ...cut,
    };
  });
}

export function WinrateChart({
  roundsAugmented,
  side,
  tournament,
}: {
  tournament: Tournament;
  roundsAugmented: AugmentedRound[];
  side: "runner" | "corp";
}) {
  const gamesById =
    side === "corp"
      ? groupGamesByCorp(roundsAugmented.flat())
      : groupGamesByRunner(roundsAugmented.flat());
  const playersById =
    side === "corp"
      ? groupPlayersByCorp(groupRoundsByCorp(roundsAugmented))
      : groupPlayersByRunner(groupRoundsByRunner(roundsAugmented));
  const wrData = winrateById(gamesById, playersById, side);
  const { players, eliminationPlayers } = tournament;
  const cutData = cutConversionById(
    eliminationPlayers ?? [],
    players ?? [],
    side
  );
  cutData
    .sort(({ id: a }, { id: b }) => {
      return a < b ? -1 : a > b ? 1 : 0;
    })
    .sort((a, b) => b.players - a.players);
  const data = mergeData(wrData, cutData);

  const [showWr, setShowWr] = useState(true);
  const [showCut, setShowCut] = useState((eliminationPlayers?.length ?? 0) > 0);

  const wrDomain = [0, 100];
  const cutDomain = ([, dataMax]: [number, number]): [number, number] => [
    0,
    Math.ceil(dataMax),
  ];
  const wrLabel = "WR (%)";
  const cutLabel = "Cut Conversion";

  return (
    <Stack mb="xl">
      <Title order={4} id={`${side}-performance`}>
        {side === "corp" ? "Corp" : "Runner"} performance
      </Title>
      <BarChart
        h={300}
        xAxisProps={{
          interval: 0,
          angle: 45,
          textAnchor: "start",
        }}
        yAxisProps={{
          domain: showWr ? wrDomain : cutDomain,
        }}
        tooltipProps={{
          content: ({ label, payload }) => (
            <ChartTooltip
              label={label}
              payload={payload}
              showWr={showWr}
              showCut={showCut}
            />
          ),
        }}
        withRightYAxis
        rightYAxisLabel="Cut Conversion"
        rightYAxisProps={{
          domain: cutDomain,
        }}
        data={data}
        dataKey="id"
        series={[
          ...(showWr ? [{ name: "winrate" }] : []),
          ...(showCut
            ? [
                {
                  name: "relative",
                  ...(showWr && showCut ? { yAxisId: "right" } : {}),
                },
              ]
            : []),
        ]}
        tickLine="none"
        gridAxis="x"
        yAxisLabel={showWr ? wrLabel : cutLabel}
        mb="lg"
        mt="lg"
      />
      <Group>
        <Checkbox
          color="gray"
          variant="outline"
          checked={showWr}
          onChange={(e) => setShowWr(e.currentTarget.checked)}
          label="Winrate"
        />
        <Checkbox
          color="gray"
          variant="outline"
          checked={showCut}
          onChange={(e) => setShowCut(e.currentTarget.checked)}
          label="Cut conversion"
        />
      </Group>
    </Stack>
  );
}
