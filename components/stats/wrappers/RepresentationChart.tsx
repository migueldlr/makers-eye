"use client";

import { DonutChart } from "@mantine/charts";
import { Player, Tournament } from "@/lib/types";
import { representationById } from "@/lib/tournament";
import {
  Group,
  luminance,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { idToFaction, shortenId } from "@/lib/util";
import { useState } from "react";

function ChartTooltip({
  label,
  payload,
}: {
  label: string;
  payload: Record<string, any>[] | undefined;
}) {
  if (!payload) return null;

  if (payload.length === 0) return null;

  const { name } = payload[0];

  const { value, rawPlayers, percentage } = payload[0].payload;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        {shortenId(name)} ({(percentage * 100).toFixed(0)}%, {value} player
        {value > 1 ? "s" : ""})
      </Text>
      <Stack gap="xs">
        {rawPlayers.map((player: Player) => (
          <Text key={player.id}>{player.name}</Text>
        ))}
      </Stack>
    </Paper>
  );
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  payload,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  payload: Record<string, any>;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={luminance(payload.fill) > 0.5 ? "black" : "white"}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {shortenId(payload.name)}
    </text>
  );
};

export function RepresentationChart({
  tournament,
  side,
}: {
  tournament: Tournament;
  side: "corp" | "runner";
}) {
  const [sortBy, setSortBy] = useState<"faction" | "popularity">("faction");
  const [games, setGames] = useState<"swiss" | "cut">("swiss");
  const [activeIndex, setActiveIndex] = useState(0);

  const { players, eliminationPlayers } = tournament;
  const data = representationById(
    players ?? [],
    eliminationPlayers ?? [],
    side,
    games
  );
  data
    .sort(({ name: a }, { name: b }) => (a < b ? -1 : a > b ? 1 : 0))
    .sort(({ value: a }, { value: b }) => b - a);
  if (sortBy === "faction") {
    data.sort(({ name: name_a }, { name: name_b }) => {
      const a = idToFaction(shortenId(name_a));
      const b = idToFaction(shortenId(name_b));
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }

  return (
    <>
      <Title order={4} id={`${side}-representation`}>
        {side === "corp" ? "Corp" : "Runner"} representation
      </Title>
      <DonutChart
        pieProps={{
          activeIndex: activeIndex,
          onMouseEnter: (_, index) => {
            setActiveIndex(index);
          },
          label: renderCustomizedLabel,
          labelLine: false,
        }}
        startAngle={90}
        endAngle={-270}
        data={data}
        size={500}
        thickness={150}
        withTooltip
        tooltipDataSource="segment"
        strokeWidth={1}
        tooltipProps={{
          content: ({ label, payload }) => (
            <ChartTooltip label={label} payload={payload} />
          ),
        }}
        m="lg"
      />

      <Group gap="xl">
        <RadioGroup
          value={games}
          onChange={(v) => setGames(v as "cut" | "swiss")}
          label="Games"
        >
          <Group mt="xs">
            <Radio value="swiss" label="Swiss" />
            <Radio value="cut" label="Cut" />
          </Group>
        </RadioGroup>
        <RadioGroup
          value={sortBy}
          onChange={(v) => setSortBy(v as "faction" | "popularity")}
          label="Sort by"
        >
          <Group mt="xs">
            <Radio value="faction" label="Faction" />
            <Radio value="popularity" label="Popularity" />
          </Group>
        </RadioGroup>
      </Group>
    </>
  );
}
