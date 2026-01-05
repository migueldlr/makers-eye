"use client";

import { useState } from "react";
import {
  Paper,
  Table,
  Text,
  Stack,
  Group,
  Switch,
  Popover,
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

  // Rows: only primary identities (sorted by ranking)
  const rowIdentities = sortedPrimaryIds;

  // Columns: "self" for each row, then all opponents
  // We'll handle this dynamically in the render

  // Create a map of identity -> Markov value for weighting
  const markovValueMap = new Map<string, number>();
  rankings.forEach((r) => markovValueMap.set(r.identity, r.markovValue));
  opponentRankings.forEach((r) => markovValueMap.set(r.identity, r.markovValue));

  // Calculate min/max for each row separately
  const rowRanges = new Map<string, { min: number; max: number }>();

  rowIdentities.forEach((destId) => {
    const destIndex = identities.indexOf(destId);
    const destMarkovValue = markovValueMap.get(destId) ?? 0;
    const rowValues: number[] = [];

    if (showSelf) {
      // Include self value
      rowValues.push(destMarkovValue * matrix[destIndex][destIndex]);
    }

    // Include opponent inflows
    sortedOpponentIds.forEach((sourceId) => {
      const sourceIndex = identities.indexOf(sourceId);
      const sourceMarkovValue = markovValueMap.get(sourceId) ?? 0;
      rowValues.push(sourceMarkovValue * (matrix[sourceIndex]?.[destIndex] ?? 0));
    });

    const minValue = Math.min(...rowValues);
    const maxValue = Math.max(...rowValues);
    rowRanges.set(destId, { min: minValue, max: maxValue });
  });

  // Helper to format cell value
  const formatValue = (value: number) => {
    const scaledValue = scale10000x ? value * 10000 : value;
    return scaledValue.toFixed(scale10000x ? 0 : 4);
  };

  // Helper to calculate color gradient normalized to row's range
  const getGradient = (value: number, rowId: string) => {
    const range = rowRanges.get(rowId);
    if (!range) return 0;
    const valueRange = range.max - range.min;
    if (valueRange === 0) return 0;
    return (value - range.min) / valueRange;
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
          {side === "corp" ? "Corp" : "Runner"} Flow Matrix
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

      {/* Matrix Table */}
      <Paper withBorder>
        <Table.ScrollContainer minWidth={800} type="native">
          <Table highlightOnHover={false} withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Identity</Table.Th>
                {showSelf && (
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
                {sortedOpponentIds.map((id, j) => (
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
                    {showSelf && (
                      <Table.Td
                        onMouseEnter={() => setHoveredCoords({ row: i, col: -1 })}
                        onMouseLeave={() => setHoveredCoords({ row: -1, col: -1 })}
                        style={{
                          fontSize: "0.7rem",
                          textAlign: "center",
                          padding: "4px",
                          cursor: "default",
                          ...(showColors && {
                            backgroundColor: `color-mix(in oklab, #071d31 ${
                              (1 - getGradient((markovValueMap.get(fromId) ?? 0) * matrix[fromIndex][fromIndex], fromId)) * 100
                            }%, #1864ab ${getGradient((markovValueMap.get(fromId) ?? 0) * matrix[fromIndex][fromIndex], fromId) * 100}%)`,
                          }),
                          ...(hoveredCoords.row === i && hoveredCoords.col === -1 && {
                            boxShadow: "inset 0 0 0 1000px rgba(0,0,0,0.3)",
                          }),
                        }}
                      >
                        {showValues && formatValue((markovValueMap.get(fromId) ?? 0) * matrix[fromIndex][fromIndex])}
                      </Table.Td>
                    )}
                    {/* Opponent transitions - showing WEIGHTED INFLOWS */}
                    {sortedOpponentIds.map((sourceId, j) => {
                      const sourceIndex = identities.indexOf(sourceId);
                      const sourceMarkovValue = markovValueMap.get(sourceId) ?? 0;
                      // Weighted inflow: state[source] * M[source][dest]
                      const transitionProb = matrix[sourceIndex]?.[fromIndex] ?? 0;
                      const weightedInflow = sourceMarkovValue * transitionProb;
                      const gradient = getGradient(weightedInflow, fromId);

                      const matchup = matchupData.find(
                        (m) => m.identity === fromId && m.opponent === sourceId
                      ) || { identity: fromId, opponent: sourceId, wins: 0, losses: 0 };

                      return (
                        <Popover
                          key={sourceId}
                          opened={hoveredMatchup?.identity === fromId && hoveredMatchup?.opponent === sourceId}
                          position="top"
                          withArrow
                        >
                          <Popover.Target>
                            <Table.Td
                              onMouseEnter={() => {
                                setHoveredCoords({ row: i, col: j });
                                setHoveredMatchup(matchup);
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
                                  backgroundColor: `color-mix(in oklab, #071d31 ${
                                    (1 - gradient) * 100
                                  }%, #1864ab ${gradient * 100}%)`,
                                }),
                                ...(hoveredCoords.row === i && hoveredCoords.col === j && {
                                  boxShadow: "inset 0 0 0 1000px rgba(0,0,0,0.3)",
                                }),
                              }}
                            >
                              {showValues && formatValue(weightedInflow)}
                            </Table.Td>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap={4}>
                              <Text c="gray.0">{matchup.identity} vs {matchup.opponent}</Text>
                              {matchup.wins === 0 && matchup.losses === 0 ? (
                                <Text c="gray.4">no matchup data</Text>
                              ) : (
                                <>
                                  <Text c="gray.3">
                                    {matchup.wins}-{matchup.losses}
                                  </Text>
                                  <Text c="gray.4">({matchup.wins + matchup.losses} games)</Text>
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
