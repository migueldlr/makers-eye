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

export default function CorpSummary({
  tournamentIds,
}: {
  tournamentIds: number[];
}) {
  const [allCorps, setAllCorps] = useState<string[]>([]);
  const [corps, setCorps] = useState<string[]>(allCorps);
  const [allRunners, setAllRunners] = useState<string[]>([]);
  const [runners, setRunners] = useState<string[]>(allRunners);
  const [data, setData] = useState<WinrateData[]>([]);
  const [minMatches, setMinMatches] = useState(1);
  const [showDraws, setShowDraws] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getMatchesMetadata({
        includeCut: true,
        includeSwiss: true,
      });
      const corpIds = res.corpData.map((c) => c.identity).filter(Boolean);
      setAllCorps(corpIds);
      setCorps(corpIds.slice(0, 5));

      const runnerIds = res.runnerData.map((c) => c.identity).filter(Boolean);
      setAllRunners(runnerIds);
      setRunners(runnerIds.slice(0, 7));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getCorpWinrates(corps, tournamentIds);
      setData(res);
      setLoading(false);
    })();
  }, [corps, tournamentIds]);

  return (
    <Stack>
      <CorpWinrateChart
        data_raw={data}
        runners={runners}
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
        <MultiSelect
          placeholder="Select runner(s)"
          value={runners}
          onChange={setRunners}
          data={allRunners}
          searchable
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
