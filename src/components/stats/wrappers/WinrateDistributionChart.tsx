"use client";

import { getMatchesMetadata, getStandings } from "@/src/app/stats/actions";
import {
  DEFAULT_UNKNOWN_ID,
  factionToColor,
  idToFaction,
} from "@/src/lib/util";
import { theme } from "@/theme";
import {
  MultiSelect,
  Stack,
  useMantineTheme,
  Paper,
  Text,
} from "@mantine/core";
import { range } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  XAxis,
  Label,
  YAxis,
  Scatter,
  Dot,
  Tooltip,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

type StandingsRow = Awaited<ReturnType<typeof getStandings>>[number];

interface ProcessedStandingsRow extends StandingsRow {
  swissWr: number;
  oppositeSideWr: number;
  color: string;
}

interface PlayerInfo {
  name: string;
  tournamentName: string;
  identityId: string;
}

interface StackedDataPoint {
  swissWr: number;
  oppositeSideWr: number;
  sos: number;
  count: number;
  ids: string[];
  colors: string[];
  primaryColor: string;
  players: PlayerInfo[];
}

function groupById(data: StandingsRow[], side: "corp" | "runner") {
  const out: Record<string, ProcessedStandingsRow[]> = {};

  for (const row of data) {
    const key =
      (side === "corp" ? row.corpShortId : row.runnerShortId) ??
      DEFAULT_UNKNOWN_ID;
    if (!out[key]) {
      out[key] = [];
    }

    out[key].push(processData(row, side));
  }
  return out;
}

function processData(
  row: StandingsRow,
  side: "corp" | "runner"
): ProcessedStandingsRow {
  const sideWins = side === "corp" ? "corpWins" : "runnerWins";
  const sideLosses = side === "corp" ? "corpLosses" : "runnerLosses";

  const oppositeSideWins = side === "corp" ? "runnerWins" : "corpWins";
  const oppositeSideLosses = side === "corp" ? "runnerLosses" : "corpLosses";

  return {
    ...row,
    swissWr: (row[sideWins]! / (row[sideWins]! + row[sideLosses]!)) * 100,
    oppositeSideWr:
      (row[oppositeSideWins]! /
        (row[oppositeSideWins]! + row[oppositeSideLosses]!)) *
      100,
    color: factionToColor(
      idToFaction(side === "corp" ? row.corpShortId : row.runnerShortId)
    ),
  };
}

function stackDataPoints(
  groupedData: Record<string, ProcessedStandingsRow[]>,
  selectedIds: string[],
  yAxis: "oppositeSideWr" | "sos"
): StackedDataPoint[] {
  // Collect all points from selected IDs
  const allPoints: ProcessedStandingsRow[] = [];
  selectedIds.forEach((id) => {
    if (groupedData[id]) {
      allPoints.push(...groupedData[id]);
    }
  });

  // Group by position (rounded to avoid floating point precision issues)
  const positionMap: Map<string, ProcessedStandingsRow[]> = new Map();

  allPoints.forEach((point) => {
    const x = Math.round(point.swissWr * 10) / 10; // Round to 1 decimal place
    const yValue =
      yAxis === "sos"
        ? point.sos
          ? parseFloat(point.sos)
          : 0
        : point.oppositeSideWr;
    const y = Math.round(yValue * 10) / 10;
    const key = `${x},${y}`;

    if (!positionMap.has(key)) {
      positionMap.set(key, []);
    }
    positionMap.get(key)!.push(point);
  });

  // Convert to stacked data points
  const stackedPoints: StackedDataPoint[] = [];
  positionMap.forEach((points, key) => {
    const [x, y] = key.split(",").map(Number);

    // Get unique IDs and colors at this position
    const idSet = new Set<string>();
    const colorSet = new Set<string>();
    const players: PlayerInfo[] = [];

    points.forEach((p) => {
      const id = (p.corpShortId || p.runnerShortId) ?? DEFAULT_UNKNOWN_ID;
      idSet.add(id);
      colorSet.add(p.color);

      // Add player information
      players.push({
        name: p.name ?? "Unknown Player",
        tournamentName: p.tournamentName ?? "Unknown Tournament",
        identityId: id,
      });
    });

    stackedPoints.push({
      swissWr: x,
      oppositeSideWr: points[0].oppositeSideWr, // Use actual value for tooltip
      sos: points[0].sos ? parseFloat(points[0].sos) : 0,
      count: points.length,
      ids: Array.from(idSet),
      colors: Array.from(colorSet),
      primaryColor: points[0].color, // Use first point's color as primary
      players: players,
    });
  });

  return stackedPoints;
}

function CustomDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: StackedDataPoint;
}) {
  if (!cx || !cy || !payload) return null;

  // Base size 5, scale up based on count (with sqrt for better visual scaling)
  const radius = 5 + Math.sqrt(payload.count - 1) * 3;

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={radius}
      fill={payload.primaryColor}
      fillOpacity={0.8}
    />
  );
}

function ChartTooltip({
  active,
  payload,
  yAxis,
}: TooltipProps<ValueType, NameType> & { yAxis: string }) {
  if (!active || !payload || !payload[0]?.payload) return null;

  const data = payload[0].payload as StackedDataPoint;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md" maw={400}>
      <Stack gap="xs">
        <Text size="sm" fw={600}>
          Swiss WR: {data.swissWr.toFixed(1)}%
        </Text>
        <Text size="sm" fw={600}>
          {yAxis === "sos" ? "SoS" : "Opposite Side WR"}:{" "}
          {yAxis === "sos"
            ? data.sos.toFixed(1)
            : data.oppositeSideWr.toFixed(1)}
          %
        </Text>
        {data.count > 1 && (
          <Text size="sm" c="dimmed">
            {data.count} players at this position
          </Text>
        )}
        <Stack gap={4}>
          {data.players.map((player, idx) => (
            <Text key={idx} size="xs">
              <Text span fw={500}>
                {player.name}
              </Text>
              {" - "}
              <Text span c="dimmed">
                {player.tournamentName}
              </Text>{" "}
              <Text span fs="italic">
                ({player.identityId})
              </Text>
            </Text>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function WinrateDistributionChart({
  side,
  tournamentIds,
  includeCut,
  includeSwiss,
}: {
  side: "corp" | "runner";
  tournamentIds: number[];
  includeCut: boolean;
  includeSwiss: boolean;
}) {
  const theme = useMantineTheme();
  const [allMainSideIds, setAllMainSideIds] = useState<string[]>([]);
  const [mainSideIds, setMainSideIds] = useState<string[]>(allMainSideIds);

  const [data, setData] = useState<StandingsRow[]>([]);

  const [yAxis, setYAxis] = useState<"oppositeSideWr" | "sos">(
    "oppositeSideWr"
  );

  useEffect(() => {
    (async () => {
      const res = await getStandings(tournamentIds);
      setData(res);
    })();
  }, [tournamentIds]);

  useEffect(() => {
    (async () => {
      const res = await getMatchesMetadata({
        includeCut,
        includeSwiss,
        tournamentFilter: tournamentIds,
      });
      const mainSideIds = (side === "corp" ? res.corpData : res.runnerData)
        .map((c) => c.identity)
        .filter(Boolean);

      setAllMainSideIds(mainSideIds);
    })();
  }, [tournamentIds, side, includeCut, includeSwiss]);

  const groupedData = useMemo(() => {
    return groupById(data, side);
  }, [data, side]);

  const stackedData = useMemo(() => {
    return stackDataPoints(groupedData, mainSideIds, yAxis);
  }, [groupedData, mainSideIds, yAxis]);

  return (
    <Stack>
      <ResponsiveContainer height={600} width={"100%"} style={{ padding: 10 }}>
        <ScatterChart
          data={stackedData}
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
              value={yAxis === "sos" ? "SoS" : "Opposite Side WR (%)"}
              angle={-90}
              position="insideLeft"
              fill={theme.colors.dark[2]}
            />
          </YAxis>
          <Tooltip
            isAnimationActive={false}
            cursor={{ strokeDasharray: "5 5", stroke: theme.colors.dark[2] }}
            content={<ChartTooltip yAxis={yAxis} />}
          />
          <Scatter
            data={stackedData}
            fill="#8884d8"
            shape={(props: any) => <CustomDot {...props} />}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <MultiSelect
        placeholder={side === "corp" ? "Select corp(s)" : "Select runner(s)"}
        value={mainSideIds}
        onChange={setMainSideIds}
        data={allMainSideIds}
        searchable
        clearable
      />
    </Stack>
  );
}
