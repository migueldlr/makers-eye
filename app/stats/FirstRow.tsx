import { TableTr, TableTd } from "@mantine/core";
import { WinrateData } from "./actions";
import { FillerTd } from "./MatchupTable";

export default function FirstRow({
  allSideTwoIds,
  winrates,
  mainSide,
  showPercentages,
}: {
  allSideTwoIds: string[];
  winrates: WinrateData[];
  mainSide: "runner" | "corp";
  showPercentages: boolean;
}) {
  return (
    <TableTr>
      <FillerTd count={2} />
      {allSideTwoIds.filter(Boolean).map((sideTwoId) => {
        const gamesWithSideTwoId = winrates.filter(
          (winrate) =>
            winrate.corp_id === sideTwoId || winrate.runner_id === sideTwoId
        );
        const runnerWins = gamesWithSideTwoId.reduce((acc, winrate) => {
          return acc + winrate.runner_wins;
        }, 0);
        const corpWins = gamesWithSideTwoId.reduce((acc, winrate) => {
          return acc + winrate.corp_wins;
        }, 0);
        const [sideOneWins, sideTwoWins] =
          mainSide === "runner"
            ? [runnerWins, corpWins]
            : [corpWins, runnerWins];
        const hasResults = sideOneWins + sideTwoWins > 0;
        const percentageDisplay = `${Math.round(
          (sideOneWins / (sideOneWins + sideTwoWins)) * 100
        )}%`;
        return (
          <TableTd key={sideTwoId} style={{ cursor: "default" }}>
            {showPercentages
              ? hasResults
                ? percentageDisplay
                : "-"
              : `${sideOneWins}-${sideTwoWins}`}
          </TableTd>
        );
      })}
    </TableTr>
  );
}
