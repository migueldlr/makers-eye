import {
  TableTd,
  Overlay,
  Text,
  Popover,
  PopoverTarget,
  PopoverDropdown,
  Box,
  Loader,
  Center,
  Table,
  TableTr,
  TableTh,
  TableTbody,
  TableThead,
} from "@mantine/core";
import { memo, useEffect, useState } from "react";
import {
  getMatchesByIdentity,
  MatchesByIdentity,
  WinrateData,
} from "./actions";
import { HOVER_STYLE } from "./MatchupTable";
import { useDisclosure } from "@mantine/hooks";

function MatchupHistory({
  sideOneId,
  sideTwoId,
  mainSide,
  tournamentIds,
}: {
  sideOneId: string;
  sideTwoId: string;
  mainSide: "runner" | "corp";
  tournamentIds?: number[];
}) {
  const [matchHistory, setMatchHistory] = useState<MatchesByIdentity[]>([]);

  useEffect(() => {
    (async () => {
      console.log({ sideOneId, sideTwoId, tournamentIds });
      const data = await getMatchesByIdentity(
        mainSide === "runner" ? sideOneId : sideTwoId,
        mainSide === "runner" ? sideTwoId : sideOneId,
        tournamentIds
      );
      setMatchHistory(data);
    })();
  }, []);

  const matches = (
    <Table>
      <TableThead>
        <TableTr>
          <TableTh>Tournament</TableTh>
          <TableTh>Round</TableTh>
          <TableTh>Corp</TableTh>
          <TableTh>Runner</TableTh>
          <TableTh>Result</TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>
        {matchHistory.map((match) => {
          return (
            <TableTr
              key={`${match.tournament_id}-${match.round}-${match.corp_player_name}-${match.runner_player_name}`}
            >
              <TableTd>{match.tournament_name}</TableTd>
              <TableTd>{match.round}</TableTd>
              <TableTd>{match.corp_player_name}</TableTd>
              <TableTd>{match.runner_player_name}</TableTd>
              <TableTd>{match.result}</TableTd>
            </TableTr>
          );
        })}
      </TableTbody>
    </Table>
  );

  return (
    <Box>
      <Text>
        {sideOneId} vs {sideTwoId}
      </Text>
      <Center>
        {matchHistory.length === 0 ? (
          <Loader color="gray" type="dots" />
        ) : (
          matches
        )}
      </Center>
    </Box>
  );
}

function Cell_unmemoized({
  sideOneId,
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
  tournamentIds,
}: {
  sideOneId: string;
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
  tournamentIds?: number[];
}) {
  const hovered = hoveredCoords.row === i && hoveredCoords.col === j;
  const games = gamesWithSideOneId.filter(
    (game) => game.corp_id === sideTwoId || game.runner_id === sideTwoId
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

  const gradient = (Math.sin(Math.PI * (rawWr - 0.5)) + 1) / 2;

  return (
    <Popover>
      <PopoverTarget>
        <TableTd
          key={sideTwoId}
          pos="relative"
          onMouseEnter={
            hasResults
              ? () => {
                  setHoveredCoords({
                    row: i,
                    col: j,
                  });
                }
              : undefined
          }
          onMouseLeave={
            hasResults
              ? () => {
                  setHoveredCoords({ row: -1, col: -1 });
                }
              : undefined
          }
          style={{
            cursor: "default",
            ...(showColors &&
              inRange &&
              hasMinResults && {
                backgroundColor: `color-mix(in oklab, #071d31 ${
                  (1 - gradient) * 100
                }%, #1864ab ${gradient * 100}%)`, //lighten("#580e0e", rawWr * 0.7),
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
      </PopoverTarget>
      <PopoverDropdown>
        <MatchupHistory
          sideOneId={sideOneId}
          sideTwoId={sideTwoId}
          tournamentIds={tournamentIds}
          mainSide={mainSide}
        />
      </PopoverDropdown>
    </Popover>
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
