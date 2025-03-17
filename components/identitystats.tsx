"use client";

import {
  Center,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Overlay,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import {
  AugmentedRound,
  getUniqueCorps,
  groupGamesByCorp,
  groupPlayersByCorp,
  groupPlayersByRunner,
  groupRoundsByCorp,
  groupRoundsByRunner,
} from "../lib/tournament";
import { shortenId } from "../lib/util";
import { useState } from "react";

export function IdentityStats({
  roundsAugmented,
}: {
  roundsAugmented: AugmentedRound[];
}) {
  const [hoveredCoords, setHoveredCoords] = useState<{
    row: number;
    col: number;
  }>({
    row: -1,
    col: -1,
  });
  const gamesByRunner = Object.entries(groupRoundsByRunner(roundsAugmented));
  const gamesByCorp = Object.entries(groupRoundsByCorp(roundsAugmented));

  const playersByCorp = groupPlayersByCorp(groupRoundsByCorp(roundsAugmented));
  const playersByRunner = groupPlayersByRunner(
    groupRoundsByRunner(roundsAugmented)
  );
  const allCorps = getUniqueCorps(roundsAugmented);

  function FillerTd({ count }: { count: number }) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <TableTd key={i}></TableTd>
        ))}
      </>
    );
  }

  const hoverStyle = {
    backgroundColor: "rgba(0,0,0,0.3)",
  };
  return (
    <Table>
      <TableThead>
        <TableTr>
          <FillerTd count={2} />
          {allCorps.map((corp, i) => {
            const players = playersByCorp[corp].map((player) => player.name);
            return (
              <TableTh
                key={corp}
                style={{
                  cursor: "default",
                  ...(i === hoveredCoords.col && hoverStyle),
                }}
              >
                <HoverCard>
                  <HoverCardTarget>
                    <Center>
                      <Text style={{ writingMode: "sideways-lr" }}>
                        {shortenId(corp)}
                      </Text>
                    </Center>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Stack gap="xs">
                      <Text>
                        {players.length} player{players.length > 1 ? "s" : ""}
                      </Text>
                      {players.map((player, i) => {
                        return (
                          <Text size="sm" key={i}>
                            {player}
                          </Text>
                        );
                      })}
                    </Stack>
                  </HoverCardDropdown>
                </HoverCard>
              </TableTh>
            );
          })}
        </TableTr>
      </TableThead>
      <TableTbody>
        <TableTr>
          <FillerTd count={2} />
          {gamesByCorp.map(([corp, games]) => {
            const runnerWins = games.filter(
              (game) => game.result === "runnerWin"
            );
            const corpWins = games.filter((game) => game.result === "corpWin");
            return (
              <TableTd key={corp} style={{ cursor: "default" }}>
                {runnerWins.length}-{corpWins.length}
              </TableTd>
            );
          })}
        </TableTr>
        {gamesByRunner.map(([runner, games], i) => {
          const groupedGames = groupGamesByCorp(games);
          const runnerWins = games.filter(
            (game) => game.result === "runnerWin"
          );
          const corpWins = games.filter((game) => game.result === "corpWin");
          const players = playersByRunner[runner].map((player) => player.name);
          return (
            <TableTr key={runner}>
              <TableTd
                style={{
                  cursor: "default",
                  ...(i === hoveredCoords.row && hoverStyle),
                }}
              >
                <HoverCard>
                  <HoverCardTarget>
                    <Text>{shortenId(runner)}</Text>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Stack gap="xs">
                      <Text>
                        {players.length} player{players.length > 1 ? "s" : ""}
                      </Text>
                      {players.map((player, i) => {
                        return (
                          <Text size="sm" key={i}>
                            {player}
                          </Text>
                        );
                      })}
                    </Stack>
                  </HoverCardDropdown>
                </HoverCard>
              </TableTd>
              <TableTd style={{ cursor: "default" }}>
                {runnerWins.length}-{corpWins.length}
              </TableTd>
              {allCorps.map((corp, j) => {
                const games = groupedGames[corp] ?? [];
                const runnerWins = games.filter(
                  (game) => game.result === "runnerWin"
                );
                const corpWins = games.filter(
                  (game) => game.result === "corpWin"
                );

                const hovered =
                  hoveredCoords.row === i && hoveredCoords.col === j;
                const results = games.map(
                  (game) =>
                    `R${game.round} ${game.runner.name} vs ${game.corp.name} (${
                      game.result === "runnerWin"
                        ? "runner win"
                        : game.result === "corpWin"
                        ? "corp win"
                        : "draw"
                    })`
                );

                const hasTies = games.some((game) => game.result === "draw");

                return (
                  <TableTd
                    key={corp}
                    pos="relative"
                    onMouseOver={() => {
                      games.length > 0 && setHoveredCoords({ row: i, col: j });
                    }}
                    onMouseLeave={() => {
                      setHoveredCoords({ row: -1, col: -1 });
                    }}
                    style={{
                      cursor: "default",
                      ...(games.length !== 0 && hovered && hoverStyle),
                    }}
                  >
                    {games.length === 0 ? (
                      <Overlay backgroundOpacity={0} />
                    ) : (
                      <HoverCard>
                        <HoverCardTarget>
                          <Text size="sm">
                            {runnerWins.length}-{corpWins.length}
                            {hasTies &&
                              `-${
                                games.length -
                                runnerWins.length -
                                corpWins.length
                              }`}
                          </Text>
                        </HoverCardTarget>
                        <HoverCardDropdown>
                          <Stack gap="xs">
                            {results.map((result, i) => (
                              <Text size="sm" key={i}>
                                {result}
                              </Text>
                            ))}
                          </Stack>
                        </HoverCardDropdown>
                      </HoverCard>
                    )}
                  </TableTd>
                );
              })}
            </TableTr>
          );
        })}
      </TableTbody>
    </Table>
  );
}
