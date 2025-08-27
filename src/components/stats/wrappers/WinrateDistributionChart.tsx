"use client";

import {
  getMatchesMetadata,
  getStandings,
  getSwissOnlyStandings,
} from "@/src/app/stats/actions";
import {
  DEFAULT_UNKNOWN_ID,
  factionToColor,
  idToFaction,
} from "@/src/lib/util";
import { theme } from "@/theme";
import {
  Select,
  Stack,
  useMantineTheme,
  Paper,
  Text,
  SegmentedControl,
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
  normalizedSos: number;
}

interface PlayerInfo {
  name: string;
  tournamentName: string;
  identityId: string;
  wins: number;
  losses: number;
}

interface StackedDataPoint {
  swissWr: number;
  oppositeSideWr: number;
  sos: number;
  normalizedSos: number;
  count: number;
  ids: string[];
  colors: string[];
  primaryColor: string;
  players: PlayerInfo[];
}

function groupById(data: StandingsRow[], side: "corp" | "runner") {
  const out: Record<string, ProcessedStandingsRow[]> = {};

  for (const row of data) {
    // Skip players who haven't played any games on this side
    const wins = side === "corp" ? row.corpWins || 0 : row.runnerWins || 0;
    const losses =
      side === "corp" ? row.corpLosses || 0 : row.runnerLosses || 0;
    if (wins + losses === 0) continue;

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

  const wins = row[sideWins] || 0;
  const losses = row[sideLosses] || 0;
  const oppWins = row[oppositeSideWins] || 0;
  const oppLosses = row[oppositeSideLosses] || 0;

  // Calculate win rates, defaulting to 0 if no games played
  const swissWr = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const oppositeSideWr =
    oppWins + oppLosses > 0 ? (oppWins / (oppWins + oppLosses)) * 100 : 0;

  // Calculate normalized SoS (SoS per game)
  const totalGames =
    (row.corpWins || 0) +
    (row.corpLosses || 0) +
    (row.runnerWins || 0) +
    (row.runnerLosses || 0);
  const normalizedSos =
    totalGames > 0 && row.sos ? parseFloat(row.sos) / totalGames : 0;

  return {
    ...row,
    swissWr,
    oppositeSideWr,
    normalizedSos,
    color: factionToColor(
      idToFaction(side === "corp" ? row.corpShortId : row.runnerShortId)
    ),
  };
}

function stackDataPoints(
  groupedData: Record<string, ProcessedStandingsRow[]>,
  selectedIds: string[],
  yAxis: "oppositeSideWr" | "sos" | "normalizedSos",
  side: "corp" | "runner"
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
        : yAxis === "normalizedSos"
        ? point.normalizedSos
        : point.oppositeSideWr;
    // Round SoS values to 3 decimal places, win rate to 1 decimal place
    const y =
      yAxis === "sos" || yAxis === "normalizedSos"
        ? Math.round(yValue * 1000) / 1000
        : Math.round(yValue * 10) / 10;
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
      const wins = side === "corp" ? p.corpWins ?? 0 : p.runnerWins ?? 0;
      const losses = side === "corp" ? p.corpLosses ?? 0 : p.runnerLosses ?? 0;

      players.push({
        name: p.name ?? "Unknown Player",
        tournamentName: p.tournamentName ?? "Unknown Tournament",
        identityId: id,
        wins: wins,
        losses: losses,
      });
    });

    stackedPoints.push({
      swissWr: x,
      oppositeSideWr: points[0].oppositeSideWr, // Use actual value for tooltip
      sos: points[0].sos ? parseFloat(points[0].sos) : 0,
      normalizedSos: points[0].normalizedSos,
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
  const radius = 5 + Math.sqrt(payload.count - 1) * 5;

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
          {yAxis === "sos"
            ? "SoS: "
            : yAxis === "normalizedSos"
            ? "Normalized SoS: "
            : "Opposite Side WR: "}
          {yAxis === "sos"
            ? data.sos.toFixed(3)
            : yAxis === "normalizedSos"
            ? data.normalizedSos.toFixed(4)
            : `${data.oppositeSideWr.toFixed(1)}%`}
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
              <Text span c="dimmed">
                {" ("}
                {player.wins}-{player.losses}
                {")"}
              </Text>
              {" - "}
              <Text span c="dimmed">
                {player.tournamentName}
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
  const [singleId, setSingleId] = useState<string | null>(null);

  const [data, setData] = useState<StandingsRow[]>([]);

  const [yAxis, setYAxis] = useState<
    "oppositeSideWr" | "sos" | "normalizedSos"
  >("oppositeSideWr");

  useEffect(() => {
    (async () => {
      const res = await getSwissOnlyStandings(tournamentIds);
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
      setSingleId(mainSideIds[0] || null);
    })();
  }, [tournamentIds, side, includeCut, includeSwiss]);

  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return {};
    return groupById(data, side);
  }, [data, side]);

  const stackedData = useMemo(() => {
    const selectedIds = singleId ? [singleId] : [];
    if (!selectedIds || selectedIds.length === 0) return [];
    return stackDataPoints(groupedData, selectedIds, yAxis, side);
  }, [groupedData, singleId, yAxis, side]);

  return (
    <Stack>
      <ResponsiveContainer width={600} aspect={1} style={{ padding: 10 }}>
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
            domain={
              yAxis === "sos" || yAxis === "normalizedSos"
                ? [0, "dataMax"]
                : [0, 100]
            }
          >
            <Label
              value={
                yAxis === "sos"
                  ? "Strength of Schedule"
                  : yAxis === "normalizedSos"
                  ? "Normalized SoS (per game)"
                  : "Opposite Side WR (%)"
              }
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
      <SegmentedControl
        value={yAxis}
        onChange={(value) =>
          setYAxis(value as "oppositeSideWr" | "sos" | "normalizedSos")
        }
        data={[
          { label: "Opposite Side Win Rate", value: "oppositeSideWr" },
          { label: "Strength of Schedule", value: "sos" },
          { label: "Normalized SoS", value: "normalizedSos" },
        ]}
      />
      <Select
        placeholder={side === "corp" ? "Select a corp" : "Select a runner"}
        value={singleId}
        onChange={setSingleId}
        data={allMainSideIds}
        searchable
        clearable
      />
    </Stack>
  );
}
