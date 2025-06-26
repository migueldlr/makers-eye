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
  Anchor,
} from "@mantine/core";
import { memo, useEffect, useState } from "react";
import {
  getMatchesByIdentity,
  MatchesByIdentity,
  WinrateData,
} from "@/app/stats/actions";
import { HOVER_STYLE } from "./index";

function MatchupHistory({
  sideOneId,
  sideTwoId,
  mainSide,
  tournamentIds,
  includeCut,
  includeSwiss,
}: {
  sideOneId: string;
  sideTwoId: string;
  mainSide: "runner" | "corp";
  tournamentIds?: number[];
  includeCut: boolean;
  includeSwiss: boolean;
}) {
  const [matchHistory, setMatchHistory] = useState<MatchesByIdentity[] | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const data = await getMatchesByIdentity(
        mainSide === "runner" ? sideOneId : sideTwoId,
        mainSide === "runner" ? sideTwoId : sideOneId,
        tournamentIds,
        includeCut,
        includeSwiss
      );
      setMatchHistory(data ?? []);
    })();
  }, []);

  const matchResultToText = (matchResult: string) => {
    if (mainSide === "runner") {
      if (matchResult === "runnerWin") {
        return ">";
      } else if (matchResult === "corpWin") {
        return "<";
      } else if (matchResult === "draw") {
        return "=";
      } else {
        return "?";
      }
    } else {
      if (matchResult === "runnerWin") {
        return "<";
      } else if (matchResult === "corpWin") {
        return ">";
      } else if (matchResult === "draw") {
        return "=";
      } else {
        return "?";
      }
    }
  };

  function augmentUrl(url: string, round: number) {
    if (url.includes("aesops")) {
      return `${url}/${round}`;
    }
    if (url.includes("nullsignal")) {
      return `${url}/rounds/view_pairings`;
    }
    return url;
  }

  const matches = (
    <Table>
      <TableThead>
        <TableTr>
          <TableTh>Date</TableTh>
          <TableTh>Tournament</TableTh>
          <TableTh>Round</TableTh>
          <TableTh>Table</TableTh>
          <TableTh>Phase</TableTh>
          <TableTh>{sideOneId}</TableTh>
          <TableTh>Result</TableTh>
          <TableTh>{sideTwoId}</TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>
        {matchHistory?.map((match) => {
          return (
            <TableTr
              key={`${match.tournament_id}-${match.round}-${match.corp_player_name}-${match.runner_player_name}`}
            >
              <TableTd>{match.tournament_date}</TableTd>
              <TableTd>
                <Anchor
                  href={augmentUrl(match.tournament_url, match.round)}
                  target="_blank"
                >
                  {match.tournament_name}
                </Anchor>
              </TableTd>
              <TableTd>{match.round}</TableTd>
              <TableTd>{match.round_table}</TableTd>
              <TableTd>{match.phase}</TableTd>
              <TableTd>
                {mainSide === "corp"
                  ? match.corp_player_name
                  : match.runner_player_name}
              </TableTd>
              <TableTd align="center">
                {matchResultToText(match.result)}
              </TableTd>
              <TableTd>
                {mainSide === "corp"
                  ? match.runner_player_name
                  : match.corp_player_name}
              </TableTd>
            </TableTr>
          );
        })}
      </TableTbody>
    </Table>
  );

  const loading = (
    <Center>
      <Loader color="gray" type="dots" />
    </Center>
  );

  const noMatches = (
    <Center>
      <Text>No matches found</Text>
    </Center>
  );

  return (
    <Box>
      <Text>
        {sideOneId} vs {sideTwoId}
      </Text>
      <Center>
        {matchHistory == null
          ? loading
          : matchHistory.length === 0
          ? noMatches
          : matches}
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
  includeCut,
  includeSwiss,
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
  includeCut: boolean;
  includeSwiss: boolean;
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

  const headToHead = `${sideOneWins}-${sideTwoWins}`;

  return (
    <Popover withArrow>
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
            ...(hasResults && {
              cursor: "pointer",
            }),
            ...(hasResults && hovered && HOVER_STYLE),
          }}
        >
          {games.length === 0 ? (
            <Overlay backgroundOpacity={0} />
          ) : (
            <Text size="sm">
              {showPercentages
                ? hovered
                  ? headToHead
                  : percentageDisplay
                : hovered
                ? percentageDisplay
                : headToHead}
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
          includeCut={includeCut}
          includeSwiss={includeSwiss}
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
