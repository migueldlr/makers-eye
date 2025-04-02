"use client";

import { DonutChart } from "@mantine/charts";
import { GameResults, getGameResults } from "../../../app/stats/actions";
import { Card, luminance, Paper, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { RADIAN } from "@/lib/util";

const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  payload,
  percent,
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

  if (percent < 0.05) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill={luminance(payload.fill) > 0.5 ? "black" : "white"}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {payload.name}
    </text>
  );
};

export default function GameResultsSummary({
  tournamentIds,
  includeCut,
  includeSwiss,
}: {
  tournamentIds?: number[];
  includeCut: boolean;
  includeSwiss: boolean;
}) {
  const [data, setData] = useState<GameResults>();

  useEffect(() => {
    (async () => {
      const res = await getGameResults({
        tournamentFilter: tournamentIds,
        includeCut,
        includeSwiss,
      });
      setData(res);
    })();
  }, [tournamentIds]);

  if (data == null) {
    return null;
  }

  const { runner_wins, corp_wins, draws, byes, unknowns, total_games } = data;

  const chartData = [
    {
      name: "Corp wins",
      value: corp_wins,
      color: "blue",
      percentage: corp_wins / total_games,
    },
    {
      name: "Runner wins",
      value: runner_wins,
      color: "red",
      percentage: runner_wins / total_games,
    },
    {
      name: "Draws",
      value: draws,
      color: "gray.7",
      percentage: draws / total_games,
    },
    {
      name: "Byes",
      value: byes,
      color: "gray.5",
      percentage: byes / total_games,
    },
    {
      name: "Unknowns",
      value: unknowns,
      color: "white",
      percentage: unknowns / total_games,
    },
  ];

  return (
    <Stack>
      <DonutChart
        data={chartData}
        startAngle={90}
        endAngle={-270}
        thickness={100}
        size={400}
        withTooltip
        tooltipDataSource="segment"
        pieProps={{
          label: CustomLabel,
          labelLine: false,
        }}
        tooltipProps={{
          content: ({ payload }) => {
            if (payload == null || payload.length === 0) {
              return <Paper></Paper>;
            }

            const { color, name, value, percentage } = payload[0]
              .payload as unknown as {
              color: string;
              name: string;
              value: number;
              percentage: number;
            };

            return (
              <Card withBorder>
                <Text>{name}</Text>
                <Text>
                  {value} of {total_games}
                </Text>
                <Text>{(percentage * 100).toPrecision(3)}%</Text>
              </Card>
            );
          },
        }}
      />
    </Stack>
  );
}
