"use client";

import { MarkovRanking } from "@/lib/markov";
import { idToFaction, factionToColor } from "@/lib/util";
import {
  Table,
  Text,
  Stack,
  Group,
  Badge,
  Tooltip,
  Paper,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

interface MarkovRankingChartProps {
  rankings: MarkovRanking[];
  side: "corp" | "runner";
}

export default function MarkovRankingChart({
  rankings,
  side,
}: MarkovRankingChartProps) {
  // Always sort by Markov value (descending)
  const sortedRankings = [...rankings].sort(
    (a, b) => b.markovValue - a.markovValue
  );

  if (sortedRankings.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed">
          No data available for Markov analysis. Ensure there are decisive
          matches (3-0 outcomes) in the selected tournaments.
        </Text>
      </Paper>
    );
  }

  const rows = sortedRankings.map((ranking, index) => {
    const faction = idToFaction(ranking.identity);
    const color = factionToColor(faction);

    return (
      <Table.Tr key={ranking.identity}>
        <Table.Td>
          <Text fw={index < 3 ? 700 : 400}>{index + 1}</Text>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Badge
              color={color}
              variant="filled"
              size="xs"
              style={{ width: 8, height: 16, padding: 0 }}
            >
              {" "}
            </Badge>
            <Text fw={index < 3 ? 600 : 400}>{ranking.identity}</Text>
          </Group>
        </Table.Td>
        <Table.Td>
          <Text fw={index < 3 ? 600 : 400}>
            {ranking.markovValue.toFixed(4)}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text>{(ranking.rawWinrate * 100).toFixed(1)}%</Text>
        </Table.Td>
        <Table.Td>
          <Text>{(ranking.metaShare * 100).toFixed(1)}%</Text>
        </Table.Td>
        <Table.Td>
          <Text>{ranking.totalGames}</Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="md">
      <Group gap="xs">
        <Text fw={600} size="lg">
          {side === "corp" ? "Corp" : "Runner"} Rankings
        </Text>
        <Tooltip
          label="Markov value represents identity strength based on loss-flow network analysis. Higher values indicate stronger performance considering the full meta context."
          multiline
          w={300}
        >
          <IconInfoCircle size={18} style={{ cursor: "help" }} />
        </Tooltip>
      </Group>

      <Table.ScrollContainer minWidth={600}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Rank</Table.Th>
              <Table.Th>Identity</Table.Th>
              <Table.Th>Markov Value</Table.Th>
              <Table.Th>Raw Winrate</Table.Th>
              <Table.Th>Meta Share</Table.Th>
              <Table.Th>Total Games</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
