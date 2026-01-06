"use client";

import { useState, useMemo } from "react";
import {
  Paper,
  Table,
  Text,
  Stack,
  Group,
  Switch,
  Popover,
  SegmentedControl,
} from "@mantine/core";

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
  const [scale10000x, setScale10000x] = useState(false);
  const [showSelf, setShowSelf] = useState(false);
  const [viewMode, setViewMode] = useState<"inflow" | "netflow">("inflow");
  const [perspective, setPerspective] = useState<"primary" | "opponent">("primary");
  const [hoveredCoords, setHoveredCoords] = useState({ row: -1, col: -1 });

  // Popover state for showing matchup details
  const [hoveredMatchup, setHoveredMatchup] = useState<{
    identity: string;
    opponent: string;
    wins: number;
    losses: number;
  } | null>(null);

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

  // Create a map of identity -> Markov value for weighting
  const markovValueMap = new Map<string, number>();
  rankings.forEach((r) => markovValueMap.set(r.identity, r.markovValue));
  opponentRankings.forEach((r) => markovValueMap.set(r.identity, r.markovValue));

  // In net flow mode, self-loop doesn't make sense (no opponent to compare)
  // Also, when perspective is switched, primary vs opponent are different sides, so no self-loop
  const effectiveShowSelf = showSelf && viewMode === "inflow" && perspective === "primary";

  // Calculate min/max for each row separately
  const rowRanges = new Map<string, { min: number; max: number }>();

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
    rowRanges.set(destId, { min: minValue, max: maxValue });
  });

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
  const formatValue = (value: number, showSign: boolean = false) => {
    const scaledValue = scale10000x ? value * 10000 : value;
    // Net flow (showSign=true) uses 1 decimal place when scaled, others use 0
    const decimalPlaces = scale10000x ? (showSign ? 1 : 0) : 4;
    const formatted = scaledValue.toFixed(decimalPlaces);

    if (showSign && value > 0) {
      return `+${formatted}`;
    }
    return formatted;
  };

  // Helper to calculate color for cell based on view mode
  const getCellColor = (value: number, rowId: string) => {
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
  };

  if (rowIdentities.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed">No matrix data available</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Text fw={600} size="lg">
          {perspective === "primary"
            ? (side === "corp" ? "Corp" : "Runner")
            : (side === "corp" ? "Runner" : "Corp")
          } {viewMode === "inflow" ? "Flow Matrix" : "Net Flow Matrix"}
        </Text>
      </Group>

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
          label="Scale 10000x"
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
            { label: "Weighted Inflow", value: "inflow" },
            { label: "Net Flow", value: "netflow" }
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

      {/* Matrix Table */}
      <Paper withBorder>
        <Table.ScrollContainer minWidth={800} type="native">
          <Table highlightOnHover={false} withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Identity</Table.Th>
                {effectiveShowSelf && (
                  <Table.Th
                    style={{
                      fontSize: "0.75rem",
                      writingMode: "sideways-lr",
                      padding: "8px 4px",
                      minHeight: "100px",
                      ...(hoveredCoords.col === -1 && hoveredCoords.row !== -1 && {
                        backgroundColor: "rgba(0,0,0,0.3)",
                      }),
                    }}
                  >
                    Self (Win)
                  </Table.Th>
                )}
                {columnIdentities.map((id, j) => (
                  <Table.Th
                    key={id}
                    style={{
                      fontSize: "0.75rem",
                      writingMode: "sideways-lr",
                      padding: "8px 4px",
                      minHeight: "100px",
                      ...(hoveredCoords.col === j && {
                        backgroundColor: "rgba(0,0,0,0.3)",
                      }),
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
                      style={{
                        fontSize: "0.75rem",
                        ...(hoveredCoords.row === i && {
                          backgroundColor: "rgba(0,0,0,0.3)",
                        }),
                      }}
                    >
                      {fromId}
                    </Table.Th>
                    {/* Self-loop (diagonal) - weighted by own Markov value */}
                    {effectiveShowSelf && (
                      <Table.Td
                        onMouseEnter={() => setHoveredCoords({ row: i, col: -1 })}
                        onMouseLeave={() => setHoveredCoords({ row: -1, col: -1 })}
                        style={{
                          fontSize: "0.7rem",
                          textAlign: "center",
                          padding: "4px",
                          cursor: "default",
                          ...(showColors && {
                            backgroundColor: getCellColor((markovValueMap.get(fromId) ?? 0) * matrix[fromIndex][fromIndex], fromId),
                          }),
                          ...(hoveredCoords.row === i && hoveredCoords.col === -1 && {
                            boxShadow: "inset 0 0 0 1000px rgba(0,0,0,0.3)",
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
                        <Popover
                          key={sourceId}
                          opened={
                            perspective === "primary"
                              ? (hoveredMatchup?.identity === fromId && hoveredMatchup?.opponent === sourceId)
                              : (hoveredMatchup?.identity === sourceId && hoveredMatchup?.opponent === fromId)
                          }
                          position="top"
                          withArrow
                        >
                          <Popover.Target>
                            <Table.Td
                              onMouseEnter={() => {
                                setHoveredCoords({ row: i, col: j });
                                setHoveredMatchup(matchupOrDefault);
                              }}
                              onMouseLeave={() => {
                                setHoveredCoords({ row: -1, col: -1 });
                                setHoveredMatchup(null);
                              }}
                              style={{
                                fontSize: "0.7rem",
                                textAlign: "center",
                                padding: "4px",
                                cursor: "default",
                                ...(showColors && {
                                  backgroundColor: getCellColor(cellValue, fromId),
                                }),
                                ...(hoveredCoords.row === i && hoveredCoords.col === j && {
                                  boxShadow: "inset 0 0 0 1000px rgba(0,0,0,0.3)",
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
                    })}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  );
}
