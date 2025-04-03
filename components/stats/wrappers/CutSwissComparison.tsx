"use client";

import { getIdentityWinrates, IdentityWinrateData } from "@/app/stats/actions";
import { Paper, Stack, Switch, Text, useMantineTheme } from "@mantine/core";
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
        Cut WR: {cutWr.toPrecision(3)}% ({cutGames} game
        {cutGames !== 1 ? "s" : ""})
      </Text>
      <Text>
        Swiss WR: {swissWr.toPrecision(3)}% ({swissGames} game
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
  scaleDots,
  ...rest
}: {
  cx: number;
  cy: number;
  totalGames: number;
  cutGames: number;
  color: string;
  id: string;
  scaleDots: boolean;
  gameRange: [number, number];
}) {
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={
        scaleDots
          ? Math.sqrt(convertRange(cutGames, gameRange, DOT_SIZE_RANGE))
          : 5
      }
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

    const swissWr =
      swiss.total_wins /
      (swiss.total_wins + swiss.total_losses + swiss.total_draws);
    const cutWr = cut
      ? cut.total_wins / (cut.total_wins + cut.total_losses + cut.total_draws)
      : 0;

    return {
      name: id,
      color: factionToColor(idToFaction(id)),
      data: [
        {
          cutWr: cutWr * 100,
          swissWr: swissWr * 100,
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

const DOT_SIZE_RANGE: [number, number] = [25, 500];

export default function CutSwissComparison({
  tournamentIds,
  side,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
}) {
  const theme = useMantineTheme();
  const [data, setData] = useState<CutSwissChartData[]>([]);
  const [range, setRange] = useState<[number, number]>([0, 1]);
  const [overallCutWr, setOverallCutWr] = useState(50);
  const [overallSwissWr, setOverallSwissWr] = useState(50);
  const [scaleDots, setScaleDots] = useState(true);
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

      setOverallCutWr(
        (cutData.reduce((acc, cur) => acc + cur.total_wins, 0) /
          (cutData.reduce((acc, cur) => acc + cur.total_games, 0) || 1)) *
          100
      );
      setOverallSwissWr(
        (swissData.reduce((acc, cur) => acc + cur.total_wins, 0) /
          (swissData.reduce((acc, cur) => acc + cur.total_games, 0) || 1)) *
          100
      );
    })();
  }, [tournamentIds, side]);

  return (
    <Stack>
      <ResponsiveContainer height={600} width={"100%"} style={{ padding: 10 }}>
        <ScatterChart
          data={data}
          margin={{ top: 25, right: 25, left: 25, bottom: 25 }}
        >
          <XAxis
            dataKey="swissWr"
            type="number"
            name="Swiss WR (%)"
            fill={theme.colors.dark[2]}
            domain={[0, 100]}
          >
            <Label
              value={"Swiss WR (%)"}
              offset={0}
              position="bottom"
              fill={theme.colors.dark[2]}
            />
          </XAxis>
          <YAxis
            dataKey="cutWr"
            type="number"
            fill={theme.colors.dark[2]}
            domain={[0, 100]}
          >
            <Label
              value={"Cut WR (%)"}
              angle={-90}
              position="insideLeft"
              fill={theme.colors.dark[2]}
            />
          </YAxis>
          <ZAxis dataKey="cutGames" type="number" range={range} />
          <ReferenceLine x={overallSwissWr} stroke={theme.colors.dark[4]}>
            <Label
              position="insideTopRight"
              angle={90}
              style={{
                textAnchor: "start",
                translate: 20,
              }}
            >
              {`${overallSwissWr.toPrecision(3)}%`}
            </Label>
          </ReferenceLine>
          <ReferenceLine y={overallCutWr} stroke={theme.colors.dark[4]}>
            <Label position="insideBottomLeft">{`${overallCutWr.toPrecision(
              3
            )}%`}</Label>
          </ReferenceLine>
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
              shape={<CustomDot gameRange={range} scaleDots={scaleDots} />}
            ></Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <Switch
        checked={scaleDots}
        onChange={(e) => setScaleDots(e.currentTarget.checked)}
        label="Scale dots"
      />
    </Stack>
  );
}
