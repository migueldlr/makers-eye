"use client";

import {
  Group,
  MultiSelect,
  NumberInput,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import {
  getMatchesMetadata,
  getSideWinrates,
  WinrateData,
} from "../../../app/stats/actions";
import { useEffect, useState } from "react";
import MatchupChart from "@/components/stats/charts/MatchupChart";

export default function MatchupSummary({
  tournamentIds,
  side,
  includeCut,
  includeSwiss,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
  includeCut: boolean;
  includeSwiss: boolean;
}) {
  const [allMainSideIds, setAllMainSideIds] = useState<string[]>([]);
  const [mainSideIds, setMainSideIds] = useState<string[]>(allMainSideIds);

  const [allOffSideIds, setAllOffSideIds] = useState<string[]>([]);
  const [offSideIds, setOffSideIds] = useState<string[]>(allOffSideIds);

  const [data, setData] = useState<WinrateData[]>([]);
  const [minMatches, setMinMatches] = useState(1);
  const [showDraws, setShowDraws] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getMatchesMetadata({
        includeCut: true,
        includeSwiss: true,
        tournamentFilter: tournamentIds,
      });
      const mainSideIds = (side === "corp" ? res.corpData : res.runnerData)
        .map((c) => c.identity)
        .filter(Boolean);

      setAllMainSideIds(mainSideIds);
      setMainSideIds(mainSideIds.slice(0, 5));

      const offSideIds = (side === "corp" ? res.runnerData : res.corpData)
        .map((c) => c.identity)
        .filter(Boolean);
      setAllOffSideIds(offSideIds);
      setOffSideIds(offSideIds.slice(0, 7));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getSideWinrates({
        ids: mainSideIds,
        tournamentFilter: tournamentIds,
        side,
        includeCut,
        includeSwiss,
      });
      setData(res);
      setLoading(false);
    })();
  }, [mainSideIds, tournamentIds, includeCut, includeSwiss]);

  return (
    <Stack>
      <MatchupChart
        data_raw={data}
        mainSideIds={mainSideIds}
        offSideIds={offSideIds}
        minMatches={minMatches}
        showDraws={showDraws}
        side={side}
      />
      <Group>
        <Stack>
          <MultiSelect
            placeholder={
              side === "corp" ? "Select corp(s)" : "Select runner(s)"
            }
            value={mainSideIds}
            onChange={setMainSideIds}
            data={allMainSideIds}
            searchable
            clearable
          />
          <MultiSelect
            placeholder={
              side === "corp" ? "Select runner(s)" : "Select corp(s)"
            }
            value={offSideIds}
            onChange={setOffSideIds}
            data={allOffSideIds}
            searchable
          />{" "}
          <Group>
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
      </Group>
    </Stack>
  );
}
