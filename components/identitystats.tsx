"use client";

import {
  Center,
  Overlay,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Tooltip,
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
import { Player, Tournament } from "../lib/types";
import { shortenId } from "../lib/util";
import { useState } from "react";

export function IdentityStats({
  roundsAugmented,
  playerMap,
}: {
  roundsAugmented: AugmentedRound[];
  playerMap: Record<number, Player>;
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
            const label = playersByCorp[corp]
              .map((player) => player.name)
              .join(", ");
            return (
              <TableTh
                key={corp}
                style={{
                  cursor: "default",
                  ...(i === hoveredCoords.col && hoverStyle),
                }}
              >
                <Tooltip label={label}>
                  <Center>
                    <Text style={{ writingMode: "sideways-lr" }}>
                      {shortenId(corp)}
                    </Text>
                  </Center>
                </Tooltip>
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
          const label = playersByRunner[runner]
            .map((player) => player.name)
            .join(", ");
          return (
            <TableTr key={runner}>
              <TableTd
                style={{
                  cursor: "default",
                  ...(i === hoveredCoords.row && hoverStyle),
                }}
              >
                <Tooltip label={label}>
                  <Text>{shortenId(runner)}</Text>
                </Tooltip>
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
                const label = games
                  .map(
                    (game) =>
                      `${game.runner.name} vs ${game.corp.name} (${
                        game.result === "runnerWin"
                          ? "runner win"
                          : game.result === "corpWin"
                          ? "corp win"
                          : "draw"
                      })`
                  )
                  .join(", ");

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
                      <Tooltip label={label}>
                        <Text size="sm">
                          {runnerWins.length}-{corpWins.length}
                          {hasTies &&
                            `-${
                              games.length - runnerWins.length - corpWins.length
                            }`}
                        </Text>
                      </Tooltip>
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
