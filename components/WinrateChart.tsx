"use client";

import { BarChart } from "@mantine/charts";

import {
  AugmentedRound,
  groupGamesByCorp,
  groupGamesByRunner,
  groupPlayersByCorp,
  groupPlayersByRunner,
  groupRoundsByCorp,
  groupRoundsByRunner,
  winrateById,
} from "../lib/tournament";
import { Paper, Text } from "@mantine/core";

function ChartTooltip({
  label,
  payload,
}: {
  label: string;
  payload: Record<string, any>[] | undefined;
}) {
  if (!payload) return null;

  if (payload.length === 0) return null;

  const { winrate, games } = payload[0].payload;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        {label}
      </Text>
      <Text>WR {winrate.toFixed(0)}%</Text>
      <Text>
        ({games} game{games > 0 ? "s" : ""})
      </Text>
    </Paper>
  );
}

export function WinrateChart({
  roundsAugmented,
  side,
}: {
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
  const data = winrateById(gamesById, playersById, side);
  return (
    <BarChart
      h={300}
      xAxisProps={{
        interval: 0,
        angle: 45,
        textAnchor: "start",
      }}
      yAxisProps={{
        domain: [0, 100],
      }}
      tooltipProps={{
        content: ({ label, payload }) => (
          <ChartTooltip label={label} payload={payload} />
        ),
      }}
      data={data}
      dataKey="id"
      series={[{ name: "winrate" }]}
      tickLine="none"
      gridAxis="x"
      yAxisLabel={side === "corp" ? "Corp WR (%)" : "Runner WR (%)"}
      mb="xl"
      mt="lg"
    />
  );
}
