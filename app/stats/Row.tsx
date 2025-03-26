import { shortenId } from "@/lib/util";
import { TableTr, TableTd, Text } from "@mantine/core";
import { memo, useMemo } from "react";
import Cell from "./Cell";
import { WinrateData } from "./actions";
import { HOVER_STYLE } from "./MatchupTable";

function Row_unmemoized({
  sideOneId,
  allSideTwoIds,
  winrates,
  mainSide,
  showPercentages,
  showColors,
  hoveredCoords,
  setHoveredCoords,
  i,
  minMatches,
}: {
  sideOneId: string;
  allSideTwoIds: string[];
  winrates: WinrateData[];
  mainSide: "runner" | "corp";
  showPercentages: boolean;
  showColors: boolean;
  hoveredCoords: { row: number; col: number };
  setHoveredCoords: (coords: { row: number; col: number }) => void;
  minMatches: number;
  i: number;
}) {
  const gamesWithSideOneId = useMemo(
    () =>
      winrates.filter((winrate: WinrateData) => {
        return (
          winrate.corp_identity === sideOneId ||
          winrate.runner_identity === sideOneId
        );
      }),
    [winrates, sideOneId]
  );

  const runnerWins = gamesWithSideOneId.reduce(
    (acc: number, winrate: WinrateData) => {
      return acc + winrate.runner_wins;
    },
    0
  );

  const corpWins = gamesWithSideOneId.reduce(
    (acc: number, winrate: WinrateData) => {
      return acc + winrate.corp_wins;
    },
    0
  );

  const [sideOneWins, sideTwoWins] =
    mainSide === "runner" ? [runnerWins, corpWins] : [corpWins, runnerWins];

  const hasResults = sideOneWins + sideTwoWins > 0;
  const percentageDisplay = `${Math.round(
    (sideOneWins / (sideOneWins + sideTwoWins)) * 100
  )}%`;

  return (
    <TableTr key={sideOneId}>
      <TableTd
        style={{
          cursor: "default",
          ...(i === hoveredCoords.row && HOVER_STYLE),
        }}
      >
        <Text>{shortenId(sideOneId)}</Text>
      </TableTd>
      <TableTd style={{ cursor: "default" }}>
        {showPercentages
          ? hasResults
            ? percentageDisplay
            : "-"
          : `${sideOneWins}-${sideTwoWins}`}{" "}
      </TableTd>

      {allSideTwoIds.filter(Boolean).map((sideTwoId: string, j: number) => {
        return (
          <Cell
            key={sideTwoId}
            sideTwoId={sideTwoId}
            gamesWithSideOneId={gamesWithSideOneId}
            mainSide={mainSide}
            showColors={showColors}
            showPercentages={showPercentages}
            hoveredCoords={hoveredCoords}
            setHoveredCoords={setHoveredCoords}
            i={i}
            j={j}
            minMatches={minMatches}
          />
        );
      })}
    </TableTr>
  );
}

export default memo(Row_unmemoized, (prev, next) => {
  const { i } = prev;
  for (const key in prev) {
    if (key === "hoveredCoords") continue;
    if (prev[key as keyof typeof prev] !== next[key as keyof typeof next]) {
      return false;
    }
  }
  return prev.hoveredCoords.row !== i && next.hoveredCoords.row !== i;
});
