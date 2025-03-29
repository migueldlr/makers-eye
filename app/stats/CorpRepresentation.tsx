"use client";

import {
  Box,
  Group,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getCorpPopularity, PopularityData } from "./actions";
import PopularityChart from "@/components/PopularityChart";

export default function CorpRepresentation() {
  const [sortBy, setSortBy] = useState<"faction" | "popularity">("popularity");
  const [corpData, setCorpData] = useState<PopularityData[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getCorpPopularity();
      setCorpData(res);
    })();
  }, []);

  return (
    <Stack>
      <PopularityChart data={corpData} sortBy={sortBy} />
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
