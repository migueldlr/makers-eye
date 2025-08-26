import { TableTr, TableTd } from "@mantine/core";
import { WinrateData } from "@/app/stats/actions";

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
  const runnerWins = winrates.reduce((acc, winrate) => {
    return acc + winrate.runner_wins;
  }, 0);
  const corpWins = winrates.reduce((acc, winrate) => {
    return acc + winrate.corp_wins;
  }, 0);

  const [sideOneWins, sideTwoWins] =
    mainSide === "runner" ? [runnerWins, corpWins] : [corpWins, runnerWins];
  const hasResults = sideOneWins + sideTwoWins > 0;
  const percentageDisplay = `${Math.round(
    (sideOneWins / (sideOneWins + sideTwoWins)) * 100
  )}%`;
  return (
    <TableTr>
      <TableTd style={{ fontStyle: "italic" }}>All {mainSide}s</TableTd>
      <TableTd>
        {showPercentages
          ? hasResults
            ? percentageDisplay
            : "-"
          : `${sideOneWins}-${sideTwoWins}`}
      </TableTd>
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
