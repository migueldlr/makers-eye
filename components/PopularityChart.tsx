import { PopularityData } from "@/app/stats/actions";
import {
  DEFAULT_UNKNOWN_ID,
  factionToColor,
  idToFaction,
  RADIAN,
  shortenId,
} from "@/lib/util";
import { DonutChart } from "@mantine/charts";
import { Card, luminance, Paper, Text } from "@mantine/core";

const renderCustomizedLabel = ({
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

  if (percent < 0.01) {
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
      {shortenId(payload.name)}
    </text>
  );
};

export default function PopularityChart({
  data,
  sortBy,
}: {
  data: PopularityData[];
  sortBy: "faction" | "popularity";
}) {
  const total = data.reduce((acc, curr) => acc + curr.player_count, 0);
  const series = data.map((corp) => {
    return {
      name: corp.identity ?? DEFAULT_UNKNOWN_ID,
      value: corp.player_count,
      percentage: (corp.player_count / total) * 100,
      color: factionToColor(idToFaction(corp.identity)),
    };
  });

  series.sort((a, b) => {
    if (sortBy === "popularity") {
      return b.value - a.value;
    } else if (sortBy === "faction") {
      const l = idToFaction(a.name);
      const r = idToFaction(b.name);
      return l < r ? -1 : l > r ? 1 : 0;
    } else {
      return 0;
    }
  });

  return (
    <DonutChart
      pieProps={{
        label: renderCustomizedLabel,
        labelLine: false,
      }}
      data={series}
      startAngle={90}
      endAngle={-270}
      thickness={200}
      size={700}
      withTooltip
      tooltipDataSource="segment"
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
                {percentage.toPrecision(2)}%, {value} player
                {value > 1 ? "s" : ""}
              </Text>
            </Card>
          );
        },
      }}
    />
  );
}
