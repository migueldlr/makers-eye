"use client";

import {
  Box,
  Group,
  MultiSelect,
  NumberInput,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { getCorpWinrates, getMatchesMetadata, WinrateData } from "./actions";
import { useEffect, useState } from "react";
import CorpWinrateChart from "@/components/CorpWinrateChart";

export default function CorpSummary() {
  const [allCorps, setAllCorps] = useState<string[]>([]);
  const [corps, setCorps] = useState<string[]>(allCorps);
  const [allRunners, setAllRunners] = useState<string[]>([]);
  const [data, setData] = useState<WinrateData[]>([]);
  const [minMatches, setMinMatches] = useState(1);
  const [showDraws, setShowDraws] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getMatchesMetadata({
        includeCut: true,
        includeSwiss: true,
      });
      const corpIds = res.corpData.map((c) => c.identity).filter(Boolean);
      setAllCorps(corpIds);
      setCorps([corpIds[0]]);

      const runnerIds = res.runnerData.map((c) => c.identity).filter(Boolean);
      setAllRunners(runnerIds);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getCorpWinrates(corps);
      setData(res);
      setLoading(false);
    })();
  }, [corps]);

  return (
    <Stack>
      <CorpWinrateChart
        data_raw={data}
        allRunners={allRunners}
        corps={corps}
        minMatches={minMatches}
        showDraws={showDraws}
      />
      <Group>
        <MultiSelect
          placeholder="Select corp(s)"
          value={corps}
          onChange={setCorps}
          data={allCorps}
          searchable
          clearable
        />
        <Group gap="xs">
          <Text>Min matches:</Text>
          <NumberInput
            value={minMatches}
            onChange={(e) => setMinMatches(+e)}
            min={1}
          />
        </Group>
        <Switch
          checked={showDraws}
          onChange={(e) => setShowDraws(e.currentTarget.checked)}
          label="Show draws"
        />
      </Group>
    </Stack>
  );
}
