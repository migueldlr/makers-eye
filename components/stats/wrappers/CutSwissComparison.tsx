"use client";

import {
  getIdentityWinrates,
  getPartnerIdentityWinrates,
  IdentityWinrateData,
} from "@/app/stats/actions";
import {
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
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

function ChartTooltip({
  payload,
  yAxis,
}: TooltipProps<ValueType, NameType> & { yAxis: string }) {
  if (!payload) return null;

  if (!payload?.[0]?.payload) return null;

  const {
    totalGames,
    cutGames,
    cutWr,
    swissGames,
    swissWr,
    id,
    oppositeSideWr,
    oppositeSideGames,
  } = payload[0].payload as Payload;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text>{id}</Text>
      <Text>
        Swiss WR: {swissWr.toPrecision(3)}% ({swissGames} game
        {swissGames !== 1 ? "s" : ""})
      </Text>
      {yAxis === "oppositeSideWr" ? (
        <Text>
          Opposite Side WR: {oppositeSideWr.toPrecision(3)}% (
          {oppositeSideGames} game
          {oppositeSideGames !== 1 ? "s" : ""})
        </Text>
      ) : (
        <Text>
          Cut WR: {cutWr.toPrecision(3)}% ({cutGames} game
          {cutGames !== 1 ? "s" : ""})
        </Text>
      )}
    </Paper>
  );
}

function CustomDot({
  cx,
  cy,
  totalGames,
  cutGames,
  oppositeSideGames,
  color,
  gameRange,
  id,
  scaleDots,
  yAxis,
  ...rest
}: {
  cx: number;
  cy: number;
  totalGames: number;
  cutGames: number;
  oppositeSideGames: number;
  color: string;
  id: string;
  scaleDots: boolean;
  yAxis: string;
  gameRange: [number, number];
}) {
  const baseSize = yAxis === "oppositeSideWr" ? oppositeSideGames : cutGames;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={
        scaleDots
          ? Math.sqrt(convertRange(baseSize, gameRange, DOT_SIZE_RANGE))
          : 5
      }
      fill={color}
    />
  );
}

function processData(
  cutData: IdentityWinrateData[],
  swissData: IdentityWinrateData[],
  oppositeSideData: IdentityWinrateData[]
): CutSwissChartData[] {
  const cutDataMap: Record<string, IdentityWinrateData> = {};
  const swissDataMap: Record<string, IdentityWinrateData> = {};
  const oppositeSideDataMap: Record<string, IdentityWinrateData> = {};

  swissData.forEach((value) => {
    swissDataMap[value.id] = value;
  });
  cutData.forEach((value) => {
    cutDataMap[value.id] = value;
  });
  oppositeSideData.forEach((value) => {
    oppositeSideDataMap[value.id] = value;
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

    let data = {
      cutWr: cutWr * 100,
      swissWr: swissWr * 100,
      cutGames: cut ? cut.total_games : 0,
      swissGames: swiss.total_games,
      totalGames: swiss.total_games + (cut ? cut.total_games : 0),
      oppositeSideWr: 0,
      oppositeSideGames: 0,
      id: id,
      color: factionToColor(idToFaction(id)),
    };

    const oppositeSide = oppositeSideDataMap[id];

    if (!oppositeSide) {
      data.oppositeSideWr = 0;
      data.oppositeSideGames = 0;
    } else {
      data.oppositeSideWr = oppositeSide.win_rate * 100;
      data.oppositeSideGames = oppositeSide.total_games;
    }

    return {
      name: id,
      color: factionToColor(idToFaction(id)),
      data: [data],
    };
  });
}

interface Payload {
  cutWr: number;
  swissWr: number;
  oppositeSideWr: number;
  cutGames: number;
  swissGames: number;
  totalGames: number;
  oppositeSideGames: number;
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
  // const [range, setRange] = useState<[number, number]>([0, 1]);
  const [overallCutWr, setOverallCutWr] = useState(50);
  const [overallSwissWr, setOverallSwissWr] = useState(50);
  const [overallOppositeSideWr, setOverallOppositeSideWr] = useState(50);
  const [scaleDots, setScaleDots] = useState(true);
  const [yAxis, setYAxis] = useState<"cutWr" | "oppositeSideWr">(
    "oppositeSideWr"
  );
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

      const oppositeSideData = await getPartnerIdentityWinrates({
        tournamentIds: tournamentIds,
        side: side === "corp" ? "runner" : "corp",
      });

      const processedData = processData(cutData, swissData, oppositeSideData);
      setData(processedData);

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
      setOverallOppositeSideWr(
        (oppositeSideData.reduce((acc, cur) => acc + cur.total_wins, 0) /
          (oppositeSideData.reduce((acc, cur) => acc + cur.total_games, 0) ||
            1)) *
          100
      );
    })();
  }, [tournamentIds, side]);

  const range: [number, number] = useMemo(() => {
    const index = yAxis === "cutWr" ? "cutGames" : "oppositeSideGames";
    return [
      Math.min(
        ...data.map((series) => Math.min(...series.data.map((d) => d[index])))
      ),
      Math.max(
        ...data.map((series) => Math.max(...series.data.map((d) => d[index])))
      ),
    ];
  }, [data, yAxis]);

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
            dataKey={yAxis}
            type="number"
            fill={theme.colors.dark[2]}
            domain={[0, 100]}
          >
            <Label
              value={yAxis === "cutWr" ? "Cut WR (%)" : "Opposite Side WR (%)"}
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
          <ReferenceLine
            y={yAxis === "cutWr" ? overallCutWr : overallOppositeSideWr}
            stroke={theme.colors.dark[4]}
          >
            <Label position="insideBottomLeft">{`${(yAxis === "cutWr"
              ? overallCutWr
              : overallOppositeSideWr
            ).toPrecision(3)}%`}</Label>
          </ReferenceLine>
          <Tooltip
            isAnimationActive={false}
            cursor={{ strokeDasharray: "5 5", stroke: theme.colors.dark[2] }}
            content={<ChartTooltip yAxis={yAxis} />}
          />
          {data.map((series) => (
            <Scatter
              key={series.name}
              name={series.name}
              data={series.data}
              fill={series.color}
              shape={
                // @ts-ignore
                <CustomDot
                  gameRange={range}
                  scaleDots={scaleDots}
                  yAxis={yAxis}
                />
              }
            ></Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <Group>
        <Switch
          checked={scaleDots}
          onChange={(e) => setScaleDots(e.currentTarget.checked)}
          label="Scale dots"
        />
        <Select
          value={yAxis}
          onChange={(value) => setYAxis(value as "cutWr" | "oppositeSideWr")}
          label="Y-axis"
          data={[
            { value: "cutWr", label: "Cut WR" },
            { value: "oppositeSideWr", label: "Opposite side WR" },
          ]}
        />
      </Group>
    </Stack>
  );
}
