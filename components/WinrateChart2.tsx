"use client";

import { CorpWinrateData } from "@/app/stats/actions";
import { FACTION_NAMES, idToFaction, factionToColor } from "@/lib/util";
import {
  Paper,
  Card,
  Text,
  Stack,
  SegmentedControl,
  Group,
  NumberInput,
} from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { useState } from "react";

export default function WinrateChart({
  winrates,
}: {
  winrates: CorpWinrateData[];
}) {
  const [sortBy, setSortBy] = useState<string>("winrate");
  const [minMatches, setMinMatches] = useState<number>(10);
  const data = winrates
    .filter((winrate) => winrate.total_games >= minMatches)
    .map((winrate) => {
      const id = winrate.corp_id;
      const winrates: { [key: string]: number | null } = {};
      const total =
        winrate.total_wins + winrate.total_losses + winrate.total_draws;
      const wr = (winrate.total_wins / total) * 100;
      FACTION_NAMES.forEach((faction) => {
        winrates[`${faction}-wr`] = idToFaction(id) === faction ? wr : null;
      });
      return {
        name: winrate.corp_id,
        ...winrates,
        value: wr,
        total_games: winrate.total_games,
        total_wins: winrate.total_wins,
        total_losses: winrate.total_losses,
      };
    });

  if (sortBy === "winrate") {
    data.sort((a, b) => b.value - a.value);
  } else if (sortBy === "popularity") {
    data.sort((a, b) => b.total_games - a.total_games);
  } else if (sortBy === "faction") {
    data.sort((a, b) => {
      const l = idToFaction(a.name);
      const r = idToFaction(b.name);
      return l < r ? -1 : l > r ? 1 : 0;
    });
  }

  return (
    <Stack>
      <BarChart
        data={data}
        h={300}
        dataKey="name"
        type="stacked"
        series={FACTION_NAMES.map((faction) => ({
          name: `${faction}-wr`,
          color: factionToColor(faction),
        }))}
        yAxisProps={{
          domain: [0, 100],
        }}
        tooltipProps={{
          content: ({ payload }) => {
            if (payload == null || payload.length === 0) {
              return <Paper></Paper>;
            }

            const {
              color,
              name,
              value,
              total_games,
              total_wins,
              total_losses,
            } = payload[0].payload as unknown as {
              color: string;
              name: string;
              value: number;
              total_games: number;
              total_wins: number;
              total_losses: number;
            };

            return (
              <Card withBorder>
                <Text>{name}</Text>
                <Text>{value.toPrecision(2)}%</Text>
                <Text>
                  ({total_games} game{total_games > 0 ? "s" : ""})
                </Text>
                <Text>
                  {total_wins}-{total_losses}
                </Text>
              </Card>
            );
          },
        }}
      />
      <Group>
        <Text>Sort by</Text>
        <SegmentedControl
          value={sortBy}
          onChange={setSortBy}
          color="blue"
          data={[
            { label: "Winrate", value: "winrate" },
            { label: "Popularity", value: "popularity" },
            { label: "Faction", value: "faction" },
          ]}
        />
      </Group>
      <Group>
        <Text>Min matches</Text>
        <NumberInput
          value={minMatches}
          onChange={(n) => setMinMatches(Number(n))}
        />
      </Group>
    </Stack>
  );
}
