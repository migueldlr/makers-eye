import { AugmentedRound } from "@/lib/tournament";
import { Stack, Text, Code } from "@mantine/core";
import React from "react";

export default function SideComparison({
  roundsAugmented,
}: {
  roundsAugmented: AugmentedRound[];
}) {
  const countResults = (targetResult: string) =>
    roundsAugmented
      .flatMap((round) =>
        round.map((game) => (game.result === targetResult ? 1 : 0))
      )
      .reduce((a: number, b: number) => a + b, 0);

  const runnerWins = countResults("runnerWin");
  const corpWins = countResults("corpWin");
  const draws = countResults("draw");
  const byes = countResults("bye");
  const unknown = countResults("unknown");

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
        {[
          { value: draws, label: "draw" },
          { value: byes, label: "bye" },
          { value: unknown, label: "unknown" },
        ].map(({ value, label }) =>
          value > 0 ? (
            <React.Fragment key={label}>
              {", "}
              <Code>{value}</Code>
              {` ${label}${value !== 1 ? "s" : ""}`}
            </React.Fragment>
          ) : null
        )}{" "}
      </Text>
    </Stack>
  );
  //   return <PieChart></PieChart>;
}
