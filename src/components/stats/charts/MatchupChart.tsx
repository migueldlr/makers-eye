import { WinrateData } from "@/app/stats/actions";
import { factionToColor, idToFaction } from "@/lib/util";
import { BarChart } from "@mantine/charts";
import { Box, darken, Paper, Text } from "@mantine/core";

function groupWinrateByOffSide(
  data: WinrateData[],
  mainSideIds: string[],
  offSideIds: string[],
  minMatches: number,
  side: "corp" | "runner"
): {
  [k: string]: null | number | string;
}[] {
  const grouped = offSideIds.map((offSideId) => {
    const dataByOffSide = data.filter(
      (d) => (side === "corp" ? d.runner_id : d.corp_id) === offSideId
    );
    const out: {
      [k: string]: null | number;
    } = {};
    mainSideIds.forEach((mainSideId) => {
      const games = dataByOffSide.filter(
        (d) => (side === "corp" ? d.corp_id : d.runner_id) === mainSideId
      );
      const corpWins = games.reduce((acc, d) => acc + d.corp_wins, 0);
      const draws = games.reduce((acc, d) => acc + d.draws, 0);
      const runnerWins = games.reduce((acc, d) => acc + d.runner_wins, 0);
      const total = games.reduce((acc, d) => acc + d.total_games, 0);
      out[`${mainSideId}-total`] = total;
      out[`${mainSideId}-draws`] = draws;

      if (side === "corp") {
        out[`${mainSideId}-wins`] = corpWins;
        out[`${mainSideId}-losses`] = runnerWins;
      } else {
        out[`${mainSideId}-wins`] = runnerWins;
        out[`${mainSideId}-losses`] = corpWins;
      }
      if (total < minMatches) {
        out[`${mainSideId}-wr`] = null;
        out[`${mainSideId}-drawRate`] = null;
        return;
      }
      out[`${mainSideId}-drawRate`] = (draws / total) * 100;
      out[`${mainSideId}-wr`] =
        ((side === "corp" ? corpWins : runnerWins) / total) * 100;
    });
    return {
      [side === "corp" ? "runner" : "corp"]: offSideId,
      ...out,
    };
  });

  return grouped;
}

function sumWinrateBySide(
  winrateData: WinrateData[],
  mainSideIds: string[],
  offSideIds: string[],
  side: "corp" | "runner"
) {
  if (!winrateData || winrateData.length === 0)
    return { corpWins: 0, runnerWins: 0, draws: 0, total: 0 };

  let corpWins = 0;
  let runnerWins = 0;
  let draws = 0;
  let total = 0;

  // Filter and aggregate only the matchups between mainSideIds and offSideIds
  winrateData.forEach((data) => {
    const isRelevantMatchup =
      side === "corp"
        ? mainSideIds.includes(data.corp_id) &&
          offSideIds.includes(data.runner_id)
        : mainSideIds.includes(data.runner_id) &&
          offSideIds.includes(data.corp_id);

    if (isRelevantMatchup) {
      corpWins += data.corp_wins;
      runnerWins += data.runner_wins;
      draws += data.draws;
      total += data.total_games;
    }
  });

  return { corpWins, runnerWins, draws, total };
}

function ChartTooltip({
  label,
  payload,
  mainSideIds,
}: {
  label?: string;
  payload?: {
    payload?: {
      [mainSideId: string]: number | string;
    };
  }[];
  mainSideIds: string[];
}) {
  if (!payload) return null;

  if (payload.length === 0) return null;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text>vs {label}</Text>
      {mainSideIds.map((mainSideId) => {
        const wr = payload[0].payload?.[`${mainSideId}-wr`];
        if (wr === null)
          return <Text key={mainSideId}>{mainSideId}: no data</Text>;

        const total = payload[0].payload?.[`${mainSideId}-total`] as number;
        const wins = payload[0].payload?.[`${mainSideId}-wins`] as number;
        const losses = payload[0].payload?.[`${mainSideId}-losses`] as number;
        const draws = payload[0].payload?.[`${mainSideId}-draws`] as number;

        const fullWinLossDraw = `${wins}-${losses}${
          draws > 0 ? `-${draws}` : ``
        }`;

        return (
          <Text key={mainSideId}>
            {mainSideId}: {Number(wr).toFixed(0)}% WR ({total} game
            {Number(total) != 1 ? "s" : ""}, {fullWinLossDraw})
          </Text>
        );
      })}
    </Paper>
  );
}

export default function MatchupChart({
  data_raw,
  mainSideIds,
  offSideIds,
  minMatches,
  showDraws,
  side,
}: {
  data_raw: WinrateData[];
  mainSideIds: string[];
  offSideIds: string[];
  minMatches: number;
  showDraws: boolean;
  side: "corp" | "runner";
}) {
  const data = groupWinrateByOffSide(
    data_raw,
    mainSideIds,
    offSideIds,
    minMatches,
    side
  );
  const series = mainSideIds.flatMap((mainSideId) => {
    return [
      {
        name: `${mainSideId}-wr`,
        color: factionToColor(idToFaction(mainSideId)),
        stackId: mainSideId,
      },
      ...(showDraws
        ? [
            {
              name: `${mainSideId}-drawRate`,
              color: darken(factionToColor(idToFaction(mainSideId)), 0.2),
              stackId: mainSideId,
            },
          ]
        : []),
    ];
  });
  const summary = sumWinrateBySide(data_raw, mainSideIds, offSideIds, side);

  return (
    <Box>
      <BarChart
        h={400}
        data={data}
        dataKey={side === "corp" ? "runner" : "corp"}
        series={series}
        tooltipProps={{
          content: ({ label, payload }) => (
            <ChartTooltip
              label={label}
              payload={payload}
              mainSideIds={mainSideIds}
            />
          ),
        }}
        yAxisProps={{
          domain: [0, 100],
        }}
      />
      <Text>
        Overall: {side === "corp" ? summary.corpWins : summary.runnerWins}-
        {side === "corp" ? summary.runnerWins : summary.corpWins}
        {summary.draws > 0 ? `-${summary.draws}` : ""}
      </Text>
    </Box>
  );
}
