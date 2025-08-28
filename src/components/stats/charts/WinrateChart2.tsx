"use client";

import { IdentityWinrateData } from "@/app/stats/actions";
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
  ErrorBar,
  ResponsiveContainer,
  Cell,
} from "recharts";
import betaincinv from "@stdlib/math-base-special-betaincinv";

// Calculate confidence interval using the beta distribution (Clopper-Pearson interval)
// This is more accurate than Wilson score for small sample sizes
function betaConfidenceInterval(
  wins: number,
  total: number,
  confidence = 0.95
): [number, number] {
  if (total === 0) return [0, 0];

  const alpha = 1 - confidence;

  // For the beta distribution, we use:
  // wins + 1 as the alpha parameter
  // losses + 1 as the beta parameter
  // This is known as the Jeffreys prior
  const losses = total - wins;

  // Lower bound: use alpha/2 quantile
  let lowerBound = 0;
  if (wins > 0) {
    lowerBound = betaincinv(alpha / 2, wins, losses + 1);
  }

  // Upper bound: use 1 - alpha/2 quantile
  let upperBound = 1;
  if (wins < total) {
    upperBound = betaincinv(1 - alpha / 2, wins + 1, losses);
  }

  return [lowerBound * 100, upperBound * 100];
}

export default function WinrateChart({
  winrates,
}: {
  winrates: IdentityWinrateData[];
}) {
  const [sortBy, setSortBy] = useState<string>("winrate");
  const [minMatches, setMinMatches] = useState<number>(10);

  const data = winrates
    .filter((winrate) => winrate.total_games >= minMatches)
    .map((winrate, index) => {
      const id = winrate.id;
      const total = winrate.total_wins + winrate.total_losses;
      const wr = total > 0 ? (winrate.total_wins / total) * 100 : 0;

      // Calculate confidence intervals using the beta distribution (Clopper-Pearson)
      // Using 75% confidence interval for tighter bounds
      const [lowerBound, upperBound] = betaConfidenceInterval(
        winrate.total_wins,
        total,
        0.75
      );
      const errorMargin = (upperBound - lowerBound) / 2;

      return {
        name: winrate.id,
        x: index,
        y: wr,
        errorY: errorMargin,
        lowerBound,
        upperBound,
        faction: idToFaction(id),
        total_games: winrate.total_games,
        total_wins: winrate.total_wins,
        total_losses: winrate.total_losses,
        total_draws: winrate.total_draws,
      };
    });

  if (sortBy === "winrate") {
    data.sort((a, b) => b.y - a.y);
  } else if (sortBy === "popularity") {
    data.sort((a, b) => b.total_games - a.total_games);
  } else if (sortBy === "faction") {
    data.sort((a, b) => {
      const l = a.faction;
      const r = b.faction;
      return l < r ? -1 : l > r ? 1 : 0;
    });
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
            <Text c="gray.0">{data.name}</Text>
            <Text c="gray.0">
              {data.y.toFixed(0)}% [{data.lowerBound.toFixed(0)}%,{" "}
              {data.upperBound.toFixed(0)}%]
            </Text>
            <Text c="gray.4">({data.total_games} games)</Text>
            <Text c="gray.3">
              {data.total_wins}-{data.total_losses}
              {data.total_draws > 0 ? `-${data.total_draws}` : ""}
            </Text>
          </Stack>
        </Card>
      );
    }
    return null;
  };

  return (
    <Stack>
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
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
            axisLine={false}
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
            <ErrorBar
              dataKey="errorY"
              width={4}
              stroke="#666"
              strokeWidth={1}
              opacity={0.8}
              direction="y"
            />
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
            { label: "Winrate", value: "winrate" },
            { label: "Games played", value: "popularity" },
            { label: "Faction", value: "faction" },
          ]}
        />
      </Group>

      <Group>
        <Text>Min matches</Text>
        <NumberInput
          min={1}
          value={minMatches}
          onChange={(n) => setMinMatches(Number(n))}
        />
      </Group>
    </Stack>
  );
}
