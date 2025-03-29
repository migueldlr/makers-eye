import { PopularityData } from "@/app/stats/actions";
import {
  DEFAULT_UNKNOWN_ID,
  factionToColor,
  idToFaction,
  shortenId,
} from "@/lib/util";
import { DonutChart } from "@mantine/charts";
import { luminance } from "@mantine/core";

const RADIAN = Math.PI / 180;

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
  const series = data.map((corp) => {
    return {
      name: corp.identity ?? DEFAULT_UNKNOWN_ID,
      value: corp.player_count,
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
        // activeIndex: activeIndex,
        // onMouseEnter: (_, index) => {
        //   setActiveIndex(index);
        // },
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
    />
  );
}
