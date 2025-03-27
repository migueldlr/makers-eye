import { Box, Code, Text } from "@mantine/core";
import { getSummaryStats } from "./actions";
import { format, parse } from "date-fns";

function transformDate(date: string) {
  return format(parse(date, "yyyy-MM-dd", new Date()), "d MMMM yyyy");
}

export default async function SummaryStats() {
  const data = await getSummaryStats();
  const {
    total_matches,
    total_players,
    total_tournaments,
    earliest_tournament,
    latest_tournament,
  } = data;
  return (
    <Box>
      <Text>
        Results from <Code>{total_matches}</Code> games of Netrunner between{" "}
        <Code>{total_players}</Code> players across{" "}
        <Code>{total_tournaments}</Code> tournaments from{" "}
        <Code>{transformDate(earliest_tournament)}</Code> to{" "}
        <Code>{transformDate(latest_tournament)}</Code>.
      </Text>
    </Box>
  );
}
