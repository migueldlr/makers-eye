"use client";

import { MarkovRanking } from "@/lib/markov";
import { idToFaction, factionToColor } from "@/lib/util";
import {
  Paper,
  Card,
  Text,
  Stack,
  SegmentedControl,
  Group,
  NumberInput,
} from "@mantine/core";
import { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MarkovValueChartProps {
  rankings: MarkovRanking[];
  side: "corp" | "runner";
}

export default function MarkovValueChart({
  rankings,
  side,
}: MarkovValueChartProps) {
  const [sortBy, setSortBy] = useState<string>("markov");
  const [minMatches, setMinMatches] = useState<number>(10);

  const data = rankings
    .filter((ranking) => ranking.totalGames >= minMatches)
    .map((ranking, index) => {
      return {
        name: ranking.identity,
        x: index,
        y: ranking.markovValue,
        faction: idToFaction(ranking.identity),
        rawWinrate: ranking.rawWinrate,
        metaShare: ranking.metaShare,
        totalGames: ranking.totalGames,
      };
    });

  if (sortBy === "markov") {
    data.sort((a, b) => b.y - a.y);
  } else if (sortBy === "winrate") {
    data.sort((a, b) => b.rawWinrate - a.rawWinrate);
  } else if (sortBy === "metashare") {
    data.sort((a, b) => b.metaShare - a.metaShare);
  } else if (sortBy === "games") {
    data.sort((a, b) => b.totalGames - a.totalGames);
  }

  // Reassign x values after sorting
  const sortedData = data.map((d, i) => ({
    ...d,
    x: i,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <Card withBorder shadow="sm" p="sm" bg="dark.8">
          <Stack gap={4}>
            <Text c="gray.0" fw={600}>
              {data.name}
            </Text>
            <Text c="gray.0">Markov: {data.y.toFixed(4)}</Text>
            <Text c="gray.3">
              Winrate: {(data.rawWinrate * 100).toFixed(1)}%
            </Text>
            <Text c="gray.3">
              Meta share: {(data.metaShare * 100).toFixed(1)}%
            </Text>
            <Text c="gray.4">({data.totalGames} games)</Text>
          </Stack>
        </Card>
      );
    }
    return null;
  };

  return (
    <Stack>
      <Text fw={600} size="lg">
        {side === "corp" ? "Corp" : "Runner"} Markov Rankings
      </Text>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
          data={sortedData}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#444444"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="x"
            type="number"
            domain={[-0.5, sortedData.length - 0.5]}
            ticks={sortedData.map((_, i) => i)}
            tick={{ fontSize: 12, textAnchor: "middle" }}
            tickFormatter={(value) => {
              const item = sortedData.find((d) => d.x === value);
              return item ? item.name : "";
            }}
            interval={0}
            height={60}
          />
          <YAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toFixed(4)}
            axisLine={false}
            label={{
              value: "Markov Value",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "#888",
              strokeWidth: 1,
              strokeDasharray: "5 5",
            }}
          />
          <Scatter
            dataKey="y"
            fill="#8884d8"
            shape={(props: any) => {
              const { cx, cy, fill } = props;
              return <circle cx={cx} cy={cy} r={10} fill={fill} />;
            }}
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={factionToColor(entry.faction)}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <Group>
        <Text>Sort by</Text>
        <SegmentedControl
          value={sortBy}
          onChange={setSortBy}
          color="blue"
          data={[
            { label: "Markov value", value: "markov" },
            { label: "Winrate", value: "winrate" },
            { label: "Games played", value: "games" },
          ]}
        />
      </Group>

      <Group>
        <Text>Min matches</Text>
        <NumberInput
          min={0}
          value={minMatches}
          onChange={(n) => setMinMatches(Number(n))}
        />
      </Group>
    </Stack>
  );
}
