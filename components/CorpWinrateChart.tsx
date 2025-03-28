import { WinrateData } from "@/app/stats/actions";
import { factionToColor, idToFaction } from "@/lib/util";
import { BarChart } from "@mantine/charts";
import { Box, Paper, Text } from "@mantine/core";

function groupWinrateByRunner(
  data: WinrateData[],
  corps: string[],
  allRunners: string[],
  minMatches: number
): {
  runner: string;
  [corp: string]: null | number | string;
}[] {
  const grouped = allRunners.map((runner) => {
    const dataByRunner = data.filter((d) => d.runner_id === runner);
    const out: {
      [corp: string]: null | number;
    } = {};
    corps.forEach((corp) => {
      const games = dataByRunner.filter((d) => d.corp_id === corp);
      const wins = games.reduce((acc, d) => acc + d.corp_wins, 0);
      const total = games.reduce((acc, d) => acc + d.total_games, 0);
      out[`${corp}-total`] = total;
      if (total < minMatches) {
        out[`${corp}-wr`] = null;
        return;
      }

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
  console.log(payload);
  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text>vs {label}</Text>
      {corps.map((corp) => {
        const wr = payload[0].payload?.[`${corp}-wr`];
        if (wr === null) return <Text key={corp}>{corp}: no data</Text>;
        const total = payload[0].payload?.[`${corp}-total`];
        return (
          <Text key={corp}>
            {corp}: {Number(wr).toFixed(0)}% ({total} game
            {Number(total) > 1 ? "s" : ""})
          </Text>
        );
      })}
    </Paper>
  );
}

export default function CorpWinrateChart({
  data_raw,
  corps,
  allRunners,
  minMatches,
}: {
  data_raw: WinrateData[];
  corps: string[];
  allRunners: string[];
  minMatches: number;
}) {
  const data = groupWinrateByRunner(data_raw, corps, allRunners, minMatches);
  const series = corps.map((corp) => {
    return {
      name: `${corp}-wr`,
      color: factionToColor(idToFaction(corp)),
    };
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
