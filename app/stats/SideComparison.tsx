import { AugmentedRound } from "@/lib/tournament";
import { Stack, Text, Code } from "@mantine/core";

export default function SideComparison({
  roundsAugmented,
}: {
  roundsAugmented: AugmentedRound[];
}) {
  const runnerWins = roundsAugmented
    .flatMap((round) => {
      return round.map((game) => {
        return game.result === "runnerWin" ? 1 : 0;
      });
    })
    .reduce((a: number, b: number) => a + b, 0);

  const corpWins = roundsAugmented
    .flatMap((round) => {
      return round.map((game) => {
        return game.result === "corpWin" ? 1 : 0;
      });
    })
    .reduce((a: number, b: number) => a + b, 0);

  const draws = roundsAugmented
    .flatMap((round) => {
      return round.map((game) => {
        return game.result === "draw" ? 1 : 0;
      });
    })
    .reduce((a: number, b: number) => a + b, 0);

  const byes = roundsAugmented
    .flatMap((round) => {
      return round.map((game) => {
        return game.result === "bye" ? 1 : 0;
      });
    })
    .reduce((a: number, b: number) => a + b, 0);

  const unknown = roundsAugmented
    .flatMap((round) => {
      return round.map((game) => {
        return game.result === "unknown" ? 1 : 0;
      });
    })
    .reduce((a: number, b: number) => a + b, 0);

  const totalGames = roundsAugmented
    .map((round) => round.length)
    .reduce((a: number, b: number) => a + b, 0);

  return (
    <Stack>
      <Text>
        <Code>{totalGames}</Code> total results
      </Text>
      <Text>
        <Code>{runnerWins}</Code> runner win{runnerWins !== 0 ? "s" : ""},{" "}
        <Code>{corpWins}</Code> corp win
        {corpWins !== 0 ? "s" : ""}
        {draws > 0 ? (
          <>
            {", "}
            <Code>{draws}</Code>
            {` draw${draws !== 1 ? "s" : ""}`}
          </>
        ) : null}
        {byes > 0 ? (
          <>
            {", "}
            <Code>{byes}</Code>
            {` bye${byes !== 1 ? "s" : ""}`}
          </>
        ) : null}
        {unknown > 0 ? (
          <>
            {", "}
            <Code>{unknown}</Code>
            {` unknown${unknown !== 1 ? "s" : ""}`}
          </>
        ) : null}
      </Text>
    </Stack>
  );
  //   return <PieChart></PieChart>;
}
