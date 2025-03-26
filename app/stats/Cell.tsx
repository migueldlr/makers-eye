import { TableTd, Overlay, Text } from "@mantine/core";
import { memo } from "react";
import { WinrateData } from "./actions";
import { HOVER_STYLE } from "./MatchupTable";

function Cell_unmemoized({
  sideTwoId,
  gamesWithSideOneId,
  mainSide,
  showColors,
  showPercentages,
  hoveredCoords,
  setHoveredCoords,
  i,
  j,
  minMatches,
  wrRange,
}: {
  sideTwoId: string;
  gamesWithSideOneId: WinrateData[];
  mainSide: "runner" | "corp";
  showColors: boolean;
  showPercentages: boolean;
  hoveredCoords: { row: number; col: number };
  setHoveredCoords: (coords: { row: number; col: number }) => void;
  i: number;
  j: number;
  minMatches: number;
  wrRange: [number, number];
}) {
  const hovered = hoveredCoords.row === i && hoveredCoords.col === j;
  const games = gamesWithSideOneId.filter(
    (game) =>
      game.corp_identity === sideTwoId || game.runner_identity === sideTwoId
  );
  const runnerWins = games.reduce((acc, game) => {
    return acc + game.runner_wins;
  }, 0);
  const corpWins = games.reduce((acc, game) => {
    return acc + game.corp_wins;
  }, 0);
  const draws = games.reduce((acc, game) => {
    return acc + game.draws;
  }, 0);

  const [sideOneWins, sideTwoWins] =
    mainSide === "runner" ? [runnerWins, corpWins] : [corpWins, runnerWins];

  const hasMinResults = sideOneWins + sideTwoWins >= minMatches;
  const hasResults = sideOneWins + sideTwoWins > 0;
  const isBlowout = sideOneWins === 0 || sideTwoWins === 0;

  const percentageDisplay = hasResults
    ? `${Math.round((sideOneWins / (sideOneWins + sideTwoWins)) * 100)}%`
    : "-";

  const rawWr = sideOneWins / (sideOneWins + sideTwoWins);
  const inRange = rawWr * 100 >= wrRange[0] && rawWr * 100 <= wrRange[1];

  return (
    <TableTd
      key={sideTwoId}
      pos="relative"
      onMouseEnter={
        hasResults
          ? () =>
              setHoveredCoords({
                row: i,
                col: j,
              })
          : undefined
      }
      onMouseLeave={
        hasResults ? () => setHoveredCoords({ row: -1, col: -1 }) : undefined
      }
      style={{
        cursor: "default",
        ...(showColors &&
          inRange &&
          hasMinResults && {
            backgroundColor: `color-mix(in oklab, #071d31 ${
              (1 - rawWr) * 100
            }%, #1864ab ${rawWr * 100}%)`, //lighten("#580e0e", rawWr * 0.7),
          }),
        ...(hasResults && hovered && HOVER_STYLE),
      }}
    >
      {games.length === 0 ? (
        <Overlay backgroundOpacity={0} />
      ) : (
        <Text size="sm">
          {showPercentages && !hovered
            ? percentageDisplay
            : `${sideOneWins}-${sideTwoWins}`}
        </Text>
      )}
    </TableTd>
  );
}

export default memo(Cell_unmemoized, (prev, next) => {
  const { j } = prev;
  for (const key in prev) {
    if (key === "hoveredCoords") continue;
    if (prev[key as keyof typeof prev] !== next[key as keyof typeof next]) {
      return false;
    }
  }
  return prev.hoveredCoords.col !== j && next.hoveredCoords.col !== j;
});
