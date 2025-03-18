"use client";

import { BarChart } from "@mantine/charts";

import { AugmentedRound, cutConversionById } from "../lib/tournament";
import { Paper, Text } from "@mantine/core";
import { Player, Tournament } from "../lib/types";

function ChartTooltip({
  label,
  payload,
}: {
  label: string;
  payload: Record<string, any>[] | undefined;
}) {
  if (!payload) return null;

  if (payload.length === 0) return null;

  const { relative, players, cutPlayers } = payload[0].payload;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        {label}
      </Text>
      <Text>{relative.toFixed(2)}x</Text>
      <Text>
        ({cutPlayers} of {players} player{players > 1 ? "s" : ""})
      </Text>
    </Paper>
  );
}

export function ConversionChart({
  tournament,
  side,
}: {
  tournament: Tournament;
  side: "runner" | "corp";
}) {
  const { players, eliminationPlayers } = tournament;
  const data = cutConversionById(eliminationPlayers ?? [], players ?? [], side);
  data
    .sort(({ id: a }, { id: b }) => {
      return a < b ? -1 : a > b ? 1 : 0;
    })
    .sort((a, b) => b.players - a.players);

  return (
    <BarChart
      h={300}
      xAxisProps={{
        interval: 0,
        angle: 45,
        textAnchor: "start",
      }}
      tooltipProps={{
        content: ({ label, payload }) => (
          <ChartTooltip label={label} payload={payload} />
        ),
      }}
      yAxisProps={{
        domain: [0, (dataMax: number) => Math.floor(dataMax)],
      }}
      data={data}
      dataKey="id"
      series={[{ name: "relative" }]}
      tickLine="none"
      gridAxis="x"
      yAxisLabel={
        side === "corp" ? "Corp Cut Conversion" : "Runner Cut Conversion"
      }
      mb="xl"
      mt="lg"
    />
  );
}
