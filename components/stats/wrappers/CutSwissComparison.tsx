"use client";

import { getIdentityWinrates, IdentityWinrateData } from "@/app/stats/actions";
import { Paper, Text, useMantineTheme } from "@mantine/core";
import { useEffect, useState } from "react";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  Dot,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { convertRange, factionToColor, idToFaction } from "@/lib/util";

function ChartTooltip(props: TooltipProps<ValueType, NameType>) {
  if (!props.payload) return null;

  if (!props.payload?.[0]?.payload) return null;

  const { totalGames, cutGames, cutWr, swissGames, swissWr, id } = props
    .payload[0].payload as Payload;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text>{id}</Text>
      <Text>
        Cut WR: {cutWr.toFixed(2)}% ({cutGames} game{cutGames !== 1 ? "s" : ""})
      </Text>
      <Text>
        Swiss WR: {swissWr.toFixed(2)}% ({swissGames} game
        {swissGames !== 1 ? "s" : ""})
      </Text>
    </Paper>
  );
}

function CustomDot({
  cx,
  cy,
  totalGames,
  cutGames,
  color,
  gameRange,
  id,
  ...rest
}: {
  cx: number;
  cy: number;
  totalGames: number;
  cutGames: number;
  color: string;
  id: string;
  gameRange: [number, number];
}) {
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={convertRange(cutGames, gameRange, [3, 20])}
      fill={color}
    />
  );
}

function processData(
  cutData: IdentityWinrateData[],
  swissData: IdentityWinrateData[]
): CutSwissChartData[] {
  const cutDataMap: Record<string, IdentityWinrateData> = {};
  const swissDataMap: Record<string, IdentityWinrateData> = {};

  swissData.forEach((value) => {
    swissDataMap[value.id] = value;
  });
  cutData.forEach((value) => {
    cutDataMap[value.id] = value;
  });

  return Object.keys(swissDataMap).map((id) => {
    const cut = cutDataMap[id];
    const swiss = swissDataMap[id];

    return {
      name: id,
      color: factionToColor(idToFaction(id)),
      data: [
        {
          cutWr: cut ? cut.win_rate : 0,
          swissWr: swiss.win_rate,
          cutGames: cut ? cut.total_games : 0,
          swissGames: swiss.total_games,
          totalGames: swiss.total_games + (cut ? cut.total_games : 0),
          id: id,
          color: factionToColor(idToFaction(id)),
        },
      ],
    };
  });
}

interface Payload {
  cutWr: number;
  swissWr: number;
  cutGames: number;
  swissGames: number;
  totalGames: number;
  id: string;
}

interface CutSwissChartData {
  name: string;
  color: string;
  data: Payload[];
}

export default function CutSwissComparison({
  tournamentIds,
  side,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
}) {
  const theme = useMantineTheme();
  console.log(theme.colors.dark[8]);
  const [data, setData] = useState<CutSwissChartData[]>([]);
  const [range, setRange] = useState<[number, number]>([0, 1]);
  useEffect(() => {
    (async () => {
      const cutData = await getIdentityWinrates({
        tournamentIds: tournamentIds,
        side: side,
        includeCut: true,
        includeSwiss: false,
      });

      const swissData = await getIdentityWinrates({
        tournamentIds: tournamentIds,
        side: side,
        includeCut: false,
        includeSwiss: true,
      });

      const processedData = processData(cutData, swissData);
      setData(processedData);

      setRange([
        Math.min(
          ...processedData.map((series) =>
            Math.min(...series.data.map((d) => d.cutGames))
          )
        ),
        Math.max(
          ...processedData.map((series) =>
            Math.max(...series.data.map((d) => d.cutGames))
          )
        ),
      ]);
    })();
  }, [tournamentIds, side]);

  console.log(range);

  return (
    <ResponsiveContainer height={500} width={"70%"} style={{ padding: 10 }}>
      <ScatterChart
        data={data}
        margin={{ top: 25, right: 25, left: 25, bottom: 25 }}
      >
        <XAxis
          dataKey="swissWr"
          type="number"
          name="Swiss WR (%)"
          fill={theme.colors.dark[2]}
        >
          <Label
            value={"Swiss WR (%)"}
            offset={0}
            position="bottom"
            fill={theme.colors.dark[2]}
          />
        </XAxis>
        <YAxis dataKey="cutWr" type="number" fill={theme.colors.dark[2]}>
          <Label
            value={"Cut WR (%)"}
            angle={-90}
            position="insideLeft"
            fill={theme.colors.dark[2]}
          />
        </YAxis>
        <ZAxis dataKey="cutGames" type="number" range={range} />
        <ReferenceLine x={50} stroke={theme.colors.dark[4]} />
        <ReferenceLine y={50} stroke={theme.colors.dark[4]} />
        <Tooltip
          isAnimationActive={false}
          cursor={{ strokeDasharray: "5 5", stroke: theme.colors.dark[2] }}
          content={ChartTooltip}
        />
        {data.map((series) => (
          <Scatter
            key={series.name}
            name={series.name}
            data={series.data}
            fill={series.color}
            // @ts-ignore
            shape={<CustomDot gameRange={range} />}
          ></Scatter>
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
