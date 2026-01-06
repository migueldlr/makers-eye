"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  Paper,
  Table,
  Text,
  Stack,
  Group,
  Switch,
  Popover,
  SegmentedControl,
  Box,
} from "@mantine/core";
import { idToFaction, factionToColor } from "@/lib/util";

// CSS for hover effects
const hoverStyles = `
  .matrix-hover-cell:hover {
    background-color: rgba(0,0,0,0.3) !important;
  }
  .matrix-hover-bar:hover {
    opacity: 1 !important;
  }
  .matrix-hover-light:hover {
    box-shadow: inset 0 0 0 1000px rgba(255,255,255,0.1) !important;
  }
`;

interface MatchupRecord {
  identity: string;
  opponent: string;
  wins: number;
  losses: number;
}

interface MarkovFlowMatrixProps {
  matrix: number[][];
  identities: string[];
  primaryIdentities: Set<string>;
  side: "corp" | "runner";
  rankings: Array<{ identity: string; markovValue: number }>;
  opponentRankings: Array<{ identity: string; markovValue: number }>;
  matchupData: MatchupRecord[];
}

// Memoized column bar component
const ColumnBar = memo(({
  identity,
  markovValue,
  faction,
  totalColumnValue,
  scale10000x,
}: {
  identity: string;
  markovValue: number;
  faction: string;
  totalColumnValue: number;
  scale10000x: boolean;
}) => {
  const heightPercent = (markovValue / totalColumnValue) * 100;
  const displayValue = scale10000x ? markovValue * 1000 : markovValue;
  const formattedValue = displayValue.toFixed(scale10000x ? 1 : 4);

  return (
    <Table.Th
      className="matrix-hover-cell"
      style={{
        padding: '2px',
        verticalAlign: 'bottom',
        width: "40px",
        maxWidth: "40px",
        transition: 'background-color 0.15s',
      }}
    >
      <Popover position="top" withArrow>
        <Popover.Target>
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              justifyContent: 'flex-end',
            }}
          >
            <Text size="xs" mb={4} c="gray.4" ta="center">
              {formattedValue}
            </Text>
            <Box
              className="matrix-hover-bar"
              style={{
                width: '20px',
                height: `${Math.max(heightPercent * 4.5, 2)}px`,
                maxHeight: '450px',
                minHeight: '4px',
                backgroundColor: factionToColor(faction),
                opacity: 0.85,
                transition: 'opacity 0.15s',
              }}
            />
          </Box>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap={4}>
            <Text c="gray.0" fw={600}>{identity}</Text>
            <Text c="gray.3" size="sm">
              Markov: {markovValue.toFixed(4)}
            </Text>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Table.Th>
  );
});

ColumnBar.displayName = 'ColumnBar';

// Memoized matrix cell component
const MatrixCell = memo(({
  cellValue,
  fromId,
  sourceId,
  matchupOrDefault,
  viewMode,
  showColors,
  showValues,
  getCellColor,
  formatValue,
  matrix,
  markovValueMap,
  identities,
}: {
  cellValue: number;
  fromId: string;
  sourceId: string;
  matchupOrDefault: MatchupRecord;
  viewMode: "inflow" | "netflow";
  showColors: boolean;
  showValues: boolean;
  getCellColor: (value: number, rowId: string) => string;
  formatValue: (value: number, showSign?: boolean) => string;
  matrix: number[][];
  markovValueMap: Map<string, number>;
  identities: string[];
}) => {
  return (
    <Popover position="top" withArrow>
      <Popover.Target>
        <Table.Td
          className="matrix-hover-light"
          style={{
            fontSize: "0.7rem",
            textAlign: "center",
            padding: "2px",
            cursor: "pointer",
            width: "40px",
            maxWidth: "40px",
            transition: 'box-shadow 0.15s',
            ...(showColors && {
              backgroundColor: getCellColor(cellValue, fromId),
            }),
          }}
        >
          {showValues && formatValue(cellValue, viewMode === "netflow")}
        </Table.Td>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={4}>
          <Text c="gray.0">{matchupOrDefault.identity} vs {matchupOrDefault.opponent}</Text>

          {viewMode === "netflow" && (() => {
            const sourceIndex = identities.indexOf(sourceId);
            const destIndex = identities.indexOf(fromId);
            const sourceMarkovValue = markovValueMap.get(sourceId) ?? 0;
            const destMarkovValue = markovValueMap.get(fromId) ?? 0;
            const weightedInflow = sourceMarkovValue * (matrix[sourceIndex]?.[destIndex] ?? 0);
            const weightedOutflow = destMarkovValue * (matrix[destIndex]?.[sourceIndex] ?? 0);

            return (
              <>
                <Text c="gray.3" size="sm">
                  Net: {formatValue(cellValue, true)}
                </Text>
                <Text c="gray.4" size="xs">
                  {matchupOrDefault.opponent} → {matchupOrDefault.identity}: {formatValue(weightedInflow, false)}
                </Text>
                <Text c="gray.4" size="xs">
                  {matchupOrDefault.identity} → {matchupOrDefault.opponent}: {formatValue(weightedOutflow, false)}
                </Text>
              </>
            );
          })()}

          {matchupOrDefault.wins === 0 && matchupOrDefault.losses === 0 ? (
            <Text c="gray.4">no matchup data</Text>
          ) : (
            <>
              <Text c="gray.3">
                {matchupOrDefault.wins}-{matchupOrDefault.losses}
              </Text>
              <Text c="gray.4">({matchupOrDefault.wins + matchupOrDefault.losses} games)</Text>
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
});

MatrixCell.displayName = 'MatrixCell';

// Memoized row bar component
const RowBar = memo(({
  identity,
  markovValue,
  faction,
  totalRowValue,
  scale10000x,
}: {
  identity: string;
  markovValue: number;
  faction: string;
  totalRowValue: number;
  scale10000x: boolean;
}) => {
  return (
    <Table.Td
      className="matrix-hover-cell"
      style={{
        padding: '4px',
        transition: 'background-color 0.15s',
      }}
    >
      <Popover position="right" withArrow>
        <Popover.Target>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              cursor: 'pointer',
              width: '100%',
              height: '100%',
              gap: '4px',
            }}
          >
            <Text
              size="xs"
              c="gray.4"
              style={{
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {(scale10000x ? markovValue * 1000 : markovValue).toFixed(scale10000x ? 1 : 4)}
            </Text>
            <Box
              className="matrix-hover-bar"
              style={{
                width: `${Math.max((markovValue / totalRowValue) * 450, 2)}px`,
                maxWidth: '450px',
                height: '20px',
                minWidth: '4px',
                backgroundColor: factionToColor(faction),
                opacity: 0.85,
                transition: 'opacity 0.15s',
              }}
            />
          </Box>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap={4}>
            <Text c="gray.0" fw={600}>{identity}</Text>
            <Text c="gray.3" size="sm">
              Markov: {markovValue.toFixed(4)}
            </Text>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Table.Td>
  );
});

RowBar.displayName = 'RowBar';

export default function MarkovFlowMatrix({
  matrix,
  identities,
  primaryIdentities,
  side,
  rankings,
  opponentRankings,
  matchupData,
}: MarkovFlowMatrixProps) {
  const [showColors, setShowColors] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [scale10000x, setScale10000x] = useState(true);
  const [showSelf, setShowSelf] = useState(false);
  const [viewMode, setViewMode] = useState<"inflow" | "netflow">("netflow");
  const [perspective, setPerspective] = useState<"primary" | "opponent">("primary");

  // Separate primary (corps/runners being ranked) from opponents
  const primaryIds = identities.filter((id) => primaryIdentities.has(id));
  const opponentIds = identities.filter((id) => !primaryIdentities.has(id));

  // Sort primary identities by Markov ranking
  const sortedPrimaryIds = [...primaryIds].sort((a, b) => {
    const aRank = rankings.find((r) => r.identity === a);
    const bRank = rankings.find((r) => r.identity === b);
    return (bRank?.markovValue ?? 0) - (aRank?.markovValue ?? 0);
  });

  // Sort opponent identities by their Markov ranking
  const sortedOpponentIds = [...opponentIds].sort((a, b) => {
    const aRank = opponentRankings.find((r) => r.identity === a);
    const bRank = opponentRankings.find((r) => r.identity === b);
    return (bRank?.markovValue ?? 0) - (aRank?.markovValue ?? 0);
  });

  // Rows and columns depend on perspective
  const rowIdentities = perspective === "primary" ? sortedPrimaryIds : sortedOpponentIds;
  const columnIdentities = perspective === "primary" ? sortedOpponentIds : sortedPrimaryIds;
  const rowRankings = perspective === "primary" ? rankings : opponentRankings;
  const colRankings = perspective === "primary" ? opponentRankings : rankings;

  // Calculate bar chart data for column identities
  const columnBarData = useMemo(() => {
    return columnIdentities.map((id) => {
      const ranking = colRankings.find((r) => r.identity === id);
      return {
        identity: id,
        markovValue: ranking?.markovValue ?? 0,
        faction: idToFaction(id),
      };
    });
  }, [columnIdentities, colRankings]);

  // Calculate total value for bar height scaling (proportion of total)
  const totalColumnValue = useMemo(() => {
    return columnBarData.reduce((sum, d) => sum + d.markovValue, 0) || 1;
  }, [columnBarData]);

  // Calculate bar chart data for row identities
  const rowBarData = useMemo(() => {
    return rowIdentities.map((id) => {
      const ranking = rowRankings.find((r) => r.identity === id);
      return {
        identity: id,
        markovValue: ranking?.markovValue ?? 0,
        faction: idToFaction(id),
      };
    });
  }, [rowIdentities, rowRankings]);

  // Calculate total value for row bar width scaling (proportion of total)
  const totalRowValue = useMemo(() => {
    return rowBarData.reduce((sum, d) => sum + d.markovValue, 0) || 1;
  }, [rowBarData]);

  // Create a map of identity -> Markov value for weighting
  const markovValueMap = useMemo(() => {
    const map = new Map<string, number>();
    rankings.forEach((r) => map.set(r.identity, r.markovValue));
    opponentRankings.forEach((r) => map.set(r.identity, r.markovValue));
    return map;
  }, [rankings, opponentRankings]);

  // In net flow mode, self-loop doesn't make sense (no opponent to compare)
  // Also, when perspective is switched, primary vs opponent are different sides, so no self-loop
  const effectiveShowSelf = showSelf && viewMode === "inflow" && perspective === "primary";

  // Calculate min/max for each row separately
  const rowRanges = useMemo(() => {
    const ranges = new Map<string, { min: number; max: number }>();

    rowIdentities.forEach((destId) => {
      const destIndex = identities.indexOf(destId);
      const destMarkovValue = markovValueMap.get(destId) ?? 0;
      const rowValues: number[] = [];

      if (effectiveShowSelf) {
        // Include self value
        rowValues.push(destMarkovValue * matrix[destIndex][destIndex]);
      }

      // Include column inflows
      columnIdentities.forEach((sourceId) => {
        const sourceIndex = identities.indexOf(sourceId);
        const sourceMarkovValue = markovValueMap.get(sourceId) ?? 0;
        rowValues.push(sourceMarkovValue * (matrix[sourceIndex]?.[destIndex] ?? 0));
      });

      const minValue = Math.min(...rowValues);
      const maxValue = Math.max(...rowValues);
      ranges.set(destId, { min: minValue, max: maxValue });
    });

    return ranges;
  }, [rowIdentities, identities, matrix, markovValueMap, effectiveShowSelf, columnIdentities]);

  // Calculate global min/max for net flow view (diverging color scale)
  const netFlowRanges = useMemo(() => {
    if (viewMode !== "netflow") return { min: 0, max: 0, absMax: 0 };

    const netFlowValues: number[] = [];

    rowIdentities.forEach((destId) => {
      const destIndex = identities.indexOf(destId);
      const destMarkovValue = markovValueMap.get(destId) ?? 0;

      columnIdentities.forEach((sourceId) => {
        const sourceIndex = identities.indexOf(sourceId);
        const sourceMarkovValue = markovValueMap.get(sourceId) ?? 0;

        const inflow = sourceMarkovValue * (matrix[sourceIndex]?.[destIndex] ?? 0);
        const outflow = destMarkovValue * (matrix[destIndex]?.[sourceIndex] ?? 0);
        const netFlow = inflow - outflow;

        netFlowValues.push(netFlow);
      });
    });

    const min = Math.min(...netFlowValues);
    const max = Math.max(...netFlowValues);
    const absMax = Math.max(Math.abs(min), Math.abs(max));

    return { min, max, absMax };
  }, [viewMode, matrix, identities, rowIdentities, columnIdentities, markovValueMap]);

  // Helper to format cell value
  const formatValue = useCallback((value: number, showSign: boolean = false) => {
    const scaledValue = scale10000x ? value * 1000 : value;
    // Always use 1 decimal place when scaled, 4 when not
    const decimalPlaces = scale10000x ? 1 : 4;
    const formatted = scaledValue.toFixed(decimalPlaces);

    if (showSign && value > 0) {
      return `+${formatted}`;
    }
    return formatted;
  }, [scale10000x]);

  // Helper to calculate color for cell based on view mode
  const getCellColor = useCallback((value: number, rowId: string) => {
    if (viewMode === "inflow") {
      // Blue gradient for weighted inflows
      const range = rowRanges.get(rowId);
      if (!range) return "#071d31";
      const valueRange = range.max - range.min;
      if (valueRange === 0) return "#071d31";
      const gradient = (value - range.min) / valueRange;

      return `color-mix(in oklab, #071d31 ${(1 - gradient) * 100}%, #1864ab ${gradient * 100}%)`;
    } else {
      // Diverging red-to-blue scale for net flows
      const absMax = netFlowRanges.absMax;
      if (absMax === 0) return "transparent";

      const normalizedValue = value / absMax; // Range: -1 to 1

      if (normalizedValue < 0) {
        // Negative: red (net loss)
        const ratio = Math.abs(normalizedValue);
        return `color-mix(in oklab, transparent ${(1 - ratio) * 100}%, #dc2626 ${ratio * 100}%)`;
      } else if (normalizedValue > 0) {
        // Positive: blue (net gain)
        const ratio = normalizedValue;
        return `color-mix(in oklab, transparent ${(1 - ratio) * 100}%, #1971c2 ${ratio * 100}%)`;
      } else {
        return "transparent";
      }
    }
  }, [viewMode, rowRanges, netFlowRanges]);

  if (rowIdentities.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed">No matrix data available</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <style dangerouslySetInnerHTML={{ __html: hoverStyles }} />
      {/* Header */}
      <Group justify="space-between">
        <Text fw={600} size="lg">
          {perspective === "primary"
            ? (side === "corp" ? "Corp" : "Runner")
            : (side === "corp" ? "Runner" : "Corp")
          } {viewMode === "inflow" ? "Flow Matrix" : "Net Flow Matrix"}
        </Text>
      </Group>

      {/* Matrix Table */}
      <Paper withBorder style={{ width: 'fit-content' }}>
        <Table.ScrollContainer minWidth={200} type="native">
          <Table highlightOnHover={false} withTableBorder withColumnBorders>
            <Table.Thead>
              {/* Column bars row */}
              <Table.Tr>
                <Table.Th rowSpan={2} style={{ verticalAlign: 'bottom', padding: '8px' }}>
                  Identity
                </Table.Th>
                <Table.Th rowSpan={2} style={{ verticalAlign: 'bottom', padding: '8px' }}>
                  Value
                </Table.Th>
                {effectiveShowSelf && (
                  <Table.Th rowSpan={2} style={{ verticalAlign: 'bottom' }}>
                    {/* Self column spans both rows */}
                  </Table.Th>
                )}
                {columnBarData.map((data) => (
                  <ColumnBar
                    key={data.identity}
                    identity={data.identity}
                    markovValue={data.markovValue}
                    faction={data.faction}
                    totalColumnValue={totalColumnValue}
                    scale10000x={scale10000x}
                  />
                ))}
              </Table.Tr>

              {/* Column labels row */}
              <Table.Tr>
                {/* Identity and Value columns handled by rowSpan above */}
                {effectiveShowSelf && (
                  <Table.Th
                    className="matrix-hover-cell"
                    style={{
                      fontSize: "0.75rem",
                      writingMode: "sideways-lr",
                      padding: "8px 2px",
                      minHeight: "100px",
                      width: "40px",
                      maxWidth: "40px",
                      transition: 'background-color 0.15s',
                    }}
                  >
                    Self (Win)
                  </Table.Th>
                )}
                {columnIdentities.map((id) => (
                  <Table.Th
                    key={id}
                    className="matrix-hover-cell"
                    style={{
                      fontSize: "0.75rem",
                      writingMode: "sideways-lr",
                      padding: "8px 2px",
                      minHeight: "100px",
                      width: "40px",
                      maxWidth: "40px",
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {id}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rowIdentities.map((fromId, i) => {
                const fromIndex = identities.indexOf(fromId);
                return (
                  <Table.Tr key={fromId}>
                    <Table.Th
                      className="matrix-hover-cell"
                      style={{
                        fontSize: "0.75rem",
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {fromId}
                    </Table.Th>
                    {/* Row bar */}
                    <RowBar
                      identity={rowBarData[i].identity}
                      markovValue={rowBarData[i].markovValue}
                      faction={rowBarData[i].faction}
                      totalRowValue={totalRowValue}
                      scale10000x={scale10000x}
                    />
                    {/* Self-loop (diagonal) - weighted by own Markov value */}
                    {effectiveShowSelf && (
                      <Table.Td
                        style={{
                          fontSize: "0.7rem",
                          textAlign: "center",
                          padding: "2px",
                          cursor: "default",
                          width: "40px",
                          maxWidth: "40px",
                          ...(showColors && {
                            backgroundColor: getCellColor((markovValueMap.get(fromId) ?? 0) * matrix[fromIndex][fromIndex], fromId),
                          }),
                        }}
                      >
                        {showValues && formatValue((markovValueMap.get(fromId) ?? 0) * matrix[fromIndex][fromIndex])}
                      </Table.Td>
                    )}
                    {/* Column transitions - showing WEIGHTED INFLOWS or NET FLOW */}
                    {columnIdentities.map((sourceId, j) => {
                      const sourceIndex = identities.indexOf(sourceId);
                      const destIndex = identities.indexOf(fromId);

                      // Calculate based on view mode
                      let cellValue: number;
                      if (viewMode === "inflow") {
                        // Weighted inflow: state[source] * M[source][dest]
                        const sourceMarkovValue = markovValueMap.get(sourceId) ?? 0;
                        const transitionProb = matrix[sourceIndex]?.[destIndex] ?? 0;
                        cellValue = sourceMarkovValue * transitionProb;
                      } else {
                        // Net flow: weighted inflow - weighted outflow
                        const sourceMarkovValue = markovValueMap.get(sourceId) ?? 0;
                        const destMarkovValue = markovValueMap.get(fromId) ?? 0;
                        const inflow = sourceMarkovValue * (matrix[sourceIndex]?.[destIndex] ?? 0);
                        const outflow = destMarkovValue * (matrix[destIndex]?.[sourceIndex] ?? 0);
                        cellValue = inflow - outflow;
                      }

                      // When perspective is flipped, matchup lookup needs to be flipped too
                      const matchup = perspective === "primary"
                        ? matchupData.find((m) => m.identity === fromId && m.opponent === sourceId)
                        : matchupData.find((m) => m.identity === sourceId && m.opponent === fromId);

                      const matchupOrDefault = matchup || (
                        perspective === "primary"
                          ? { identity: fromId, opponent: sourceId, wins: 0, losses: 0 }
                          : { identity: sourceId, opponent: fromId, wins: 0, losses: 0 }
                      );

                      return (
                        <MatrixCell
                          key={sourceId}
                          cellValue={cellValue}
                          fromId={fromId}
                          sourceId={sourceId}
                          matchupOrDefault={matchupOrDefault}
                          viewMode={viewMode}
                          showColors={showColors}
                          showValues={showValues}
                          getCellColor={getCellColor}
                          formatValue={formatValue}
                          matrix={matrix}
                          markovValueMap={markovValueMap}
                          identities={identities}
                        />
                      );
                    })}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Controls */}
      <Group gap="md">
        <Switch
          label="Show colors"
          checked={showColors}
          onChange={(e) => setShowColors(e.currentTarget.checked)}
        />
        <Switch
          label="Show values"
          checked={showValues}
          onChange={(e) => setShowValues(e.currentTarget.checked)}
        />
        <Switch
          label="Show self"
          checked={showSelf}
          onChange={(e) => setShowSelf(e.currentTarget.checked)}
        />
        <Switch
          label="Scale 1000x"
          checked={scale10000x}
          onChange={(e) => setScale10000x(e.currentTarget.checked)}
        />
      </Group>

      <Group gap="md">
        <Text>View mode</Text>
        <SegmentedControl
          value={viewMode}
          onChange={(value) => setViewMode(value as "inflow" | "netflow")}
          color="blue"
          data={[
            { label: "Net Flow", value: "netflow" },
            { label: "Weighted Inflow", value: "inflow" }
          ]}
        />
      </Group>

      <Group gap="md">
        <Text>Perspective</Text>
        <SegmentedControl
          value={perspective}
          onChange={(value) => setPerspective(value as "primary" | "opponent")}
          color="blue"
          data={[
            { label: side === "corp" ? "Corp" : "Runner", value: "primary" },
            { label: side === "corp" ? "Runner" : "Corp", value: "opponent" }
          ]}
        />
      </Group>
    </Stack>
  );
}
