"use client";

import { Group, Radio, RadioGroup, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { getPopularity, PopularityData } from "./actions";
import PopularityChart from "@/components/stats/charts/PopularityChart";

export default function RepresentationChart({
  tournamentIds,
  side,
}: {
  tournamentIds?: number[];
  side: "corp" | "runner";
}) {
  const [sortBy, setSortBy] = useState<"faction" | "popularity">("popularity");
  const [data, setData] = useState<PopularityData[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getPopularity(tournamentIds, side);
      setData(res);
    })();
  }, [tournamentIds]);

  return (
    <Stack>
      <PopularityChart data={data} sortBy={sortBy} />
      <RadioGroup
        value={sortBy}
        onChange={(v) => setSortBy(v as "faction" | "popularity")}
        label="Sort by"
      >
        <Group mt="xs">
          <Radio value="popularity" label="Popularity" />
          <Radio value="faction" label="Faction" />
        </Group>
      </RadioGroup>
    </Stack>
  );
}
