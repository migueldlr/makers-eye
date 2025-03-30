import { WinrateData } from "@/app/stats/actions";
import { factionToColor, idToFaction } from "@/lib/util";
import { BarChart } from "@mantine/charts";
import { Box, darken, Paper, Text } from "@mantine/core";

function groupWinrateByRunner(
  data: WinrateData[],
  corps: string[],
  runners: string[],
  minMatches: number
): {
  runner: string;
  [corp: string]: null | number | string;
}[] {
  const grouped = runners.map((runner) => {
    const dataByRunner = data.filter((d) => d.runner_id === runner);
    const out: {
      [corp: string]: null | number;
    } = {};
    corps.forEach((corp) => {
      const games = dataByRunner.filter((d) => d.corp_id === corp);
      const wins = games.reduce((acc, d) => acc + d.corp_wins, 0);
      const draws = games.reduce((acc, d) => acc + d.draws, 0);
      const losses = games.reduce((acc, d) => acc + d.runner_wins, 0);
      const total = games.reduce((acc, d) => acc + d.total_games, 0);
      out[`${corp}-total`] = total;
      out[`${corp}-wins`] = wins;
      out[`${corp}-draws`] = draws;
      out[`${corp}-losses`] = losses;
      if (total < minMatches) {
        out[`${corp}-wr`] = null;
        out[`${corp}-drawRate`] = null;
        return;
      }
      out[`${corp}-drawRate`] = (draws / total) * 100;

      out[`${corp}-wr`] = (wins / total) * 100;
    });

    return {
      runner,
      ...out,
    };
  });
  return grouped;
}

function ChartTooltip({
  label,
  payload,
  corps,
}: {
  label: string;
  payload?: {
    payload?: {
      [corp: string]: number | string;
    };
  }[];
  corps: string[];
}) {
  if (!payload) return null;

  if (payload.length === 0) return null;
  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text>vs {label}</Text>
      {corps.map((corp) => {
        const wr = payload[0].payload?.[`${corp}-wr`];
        if (wr === null) return <Text key={corp}>{corp}: no data</Text>;

        const total = payload[0].payload?.[`${corp}-total`] as number;
        const wins = payload[0].payload?.[`${corp}-wins`] as number;
        const losses = payload[0].payload?.[`${corp}-losses`] as number;
        const draws = payload[0].payload?.[`${corp}-draws`] as number;

        const fullWinLossDraw = `${wins}-${losses}${
          draws > 0 ? `-${draws}` : ``
        }`;

        return (
          <Text key={corp}>
            {corp}: {Number(wr).toFixed(0)}% WR ({total} game
            {Number(total) != 1 ? "s" : ""}, {fullWinLossDraw})
          </Text>
        );
      })}
    </Paper>
  );
}

export default function CorpWinrateChart({
  data_raw,
  corps,
  runners,
  minMatches,
  showDraws,
}: {
  data_raw: WinrateData[];
  corps: string[];
  runners: string[];
  minMatches: number;
  showDraws: boolean;
}) {
  const data = groupWinrateByRunner(data_raw, corps, runners, minMatches);
  const series = corps.flatMap((corp) => {
    return [
      {
        name: `${corp}-wr`,
        color: factionToColor(idToFaction(corp)),
        stackId: corp,
      },
      ...(showDraws
        ? [
            {
              name: `${corp}-drawRate`,
              color: darken(factionToColor(idToFaction(corp)), 0.2),
              stackId: corp,
            },
          ]
        : []),
    ];
  });

  return (
    <Box>
      <BarChart
        h={400}
        data={data}
        dataKey="runner"
        series={series}
        tooltipProps={{
          content: ({ label, payload }) => (
            <ChartTooltip label={label} payload={payload} corps={corps} />
          ),
        }}
        yAxisProps={{
          domain: [0, 100],
        }}
      />
    </Box>
  );
}
