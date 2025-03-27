"use client";

import {
  ActionIcon,
  Center,
  Code,
  Group,
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
  Title,
  Tooltip,
} from "@mantine/core";
import {
  AugmentedRound,
  getUniqueCorps,
  getUniqueRunners,
  groupGamesByCorp,
  groupGamesByRunner,
  groupPlayersByCorp,
  groupPlayersByRunner,
  groupRoundsByCorp,
  groupRoundsByRunner,
} from "../lib/tournament";
import { shortenId } from "../lib/util";
import { useState } from "react";
import { IconTransfer } from "@tabler/icons-react";

const HOVER_STYLE = {
  backgroundColor: "rgba(0,0,0,0.3)",
};

export function MatchupTable({
  roundsAugmented,
}: {
  roundsAugmented: AugmentedRound[];
}) {
  const [mainSide, setMainSide] = useState<"runner" | "corp">("runner");
  const [hoveredCoords, setHoveredCoords] = useState<{
    row: number;
    col: number;
  }>({
    row: -1,
    col: -1,
  });
  const [gamesBySideOneId, gamesBySideTwoId] =
    mainSide === "runner"
      ? [
          groupRoundsByRunner(roundsAugmented),
          groupRoundsByCorp(roundsAugmented),
        ]
      : [
          groupRoundsByCorp(roundsAugmented),
          groupRoundsByRunner(roundsAugmented),
        ];
  const [playersBySideOneId, playersBySideTwoId] =
    mainSide === "runner"
      ? [
          groupPlayersByRunner(groupRoundsByRunner(roundsAugmented)),
          groupPlayersByCorp(groupRoundsByCorp(roundsAugmented)),
        ]
      : [
          groupPlayersByCorp(groupRoundsByCorp(roundsAugmented)),
          groupPlayersByRunner(groupRoundsByRunner(roundsAugmented)),
        ];
  const [allSideOneIds, allSideTwoIds] =
    mainSide === "runner"
      ? [getUniqueRunners(roundsAugmented), getUniqueCorps(roundsAugmented)]
      : [getUniqueCorps(roundsAugmented), getUniqueRunners(roundsAugmented)];

  function FillerTd({ count }: { count: number }) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <TableTd key={i}></TableTd>
        ))}
      </>
    );
  }

  function switchSides() {
    setMainSide((prev) => (prev === "runner" ? "corp" : "runner"));
  }

  return (
    <Stack>
      <Title order={4} id="matchups">
        Matchup spread
      </Title>
      <Table>
        <TableThead>
          <TableTr>
            <FillerTd count={2} />
            {allSideTwoIds
              .sort((a, b) => {
                return a < b ? -1 : a > b ? 1 : 0;
              })
              .sort(
                (a, b) =>
                  playersBySideTwoId[b].length - playersBySideTwoId[a].length
              )
              .map((sideTwoId, i) => {
                const players = playersBySideTwoId[sideTwoId]
                  .filter(Boolean)
                  .map((player) => player.name);
                return (
                  <TableTh
                    key={sideTwoId}
                    style={{
                      cursor: "default",
                      ...(i === hoveredCoords.col && HOVER_STYLE),
                    }}
                  >
                    <HoverCard>
                      <HoverCardTarget>
                        <Center>
                          <Text style={{ writingMode: "sideways-lr" }}>
                            {shortenId(sideTwoId)}
                          </Text>
                        </Center>
                      </HoverCardTarget>
                      <HoverCardDropdown>
                        <Stack gap="xs">
                          <Text>
                            {players.length} player
                            {players.length > 1 ? "s" : ""}
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
            {Object.entries(gamesBySideTwoId)
              .sort(([a], [b]) => {
                return a < b ? -1 : a > b ? 1 : 0;
              })
              .sort(
                ([a], [b]) =>
                  playersBySideTwoId[b].length - playersBySideTwoId[a].length
              )
              .map(([sideTwoId, games]) => {
                const runnerWins = games.filter(
                  (game) => game.result === "runnerWin"
                );
                const corpWins = games.filter(
                  (game) => game.result === "corpWin"
                );
                const [sideOneWins, sideTwoWins] =
                  mainSide === "runner"
                    ? [runnerWins, corpWins]
                    : [corpWins, runnerWins];
                return (
                  <TableTd key={sideTwoId} style={{ cursor: "default" }}>
                    {sideOneWins.length}-{sideTwoWins.length}
                  </TableTd>
                );
              })}
          </TableTr>
          {Object.entries(gamesBySideOneId)
            .sort(([a], [b]) => {
              return a < b ? -1 : a > b ? 1 : 0;
            })
            .sort(
              ([a], [b]) =>
                playersBySideOneId[b].length - playersBySideOneId[a].length
            )
            .map(([sideOneId, games], i) => {
              const groupedGames =
                mainSide === "runner"
                  ? groupGamesByCorp(games)
                  : groupGamesByRunner(games);
              const runnerWins = games.filter(
                (game) => game.result === "runnerWin"
              );
              const corpWins = games.filter(
                (game) => game.result === "corpWin"
              );
              const [sideOneWins, sideTwoWins] =
                mainSide === "runner"
                  ? [runnerWins, corpWins]
                  : [corpWins, runnerWins];
              const players = playersBySideOneId[sideOneId]
                .filter(Boolean)
                .map((player) => player.name);
              return (
                <TableTr key={sideOneId}>
                  <TableTd
                    style={{
                      cursor: "default",
                      ...(i === hoveredCoords.row && HOVER_STYLE),
                    }}
                  >
                    <HoverCard>
                      <HoverCardTarget>
                        <Text>{shortenId(sideOneId)}</Text>
                      </HoverCardTarget>
                      <HoverCardDropdown>
                        <Stack gap="xs">
                          <Text>
                            {players.length} player
                            {players.length > 1 ? "s" : ""}
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
                    {sideOneWins.length}-{sideTwoWins.length}
                  </TableTd>
                  {allSideTwoIds
                    .sort((a, b) => {
                      return a < b ? -1 : a > b ? 1 : 0;
                    })
                    .sort(
                      (a, b) =>
                        playersBySideTwoId[b].length -
                        playersBySideTwoId[a].length
                    )
                    .map((sideTwoId, j) => {
                      const games = groupedGames[sideTwoId] ?? [];
                      // console.log(games);
                      const runnerWins = games.filter(
                        (game) => game.result === "runnerWin"
                      );
                      const corpWins = games.filter(
                        (game) => game.result === "corpWin"
                      );
                      const [sideOneWins, sideTwoWins] =
                        mainSide === "runner"
                          ? [runnerWins, corpWins]
                          : [corpWins, runnerWins];

                      const hovered =
                        hoveredCoords.row === i && hoveredCoords.col === j;
                      const results = games
                        .map((game) => {
                          if (game.runner == null || game.corp == null) {
                            return null;
                          }
                          const [sideOneName, sideTwoName] =
                            mainSide === "runner"
                              ? [game.runner.name, game.corp.name]
                              : [game.corp.name, game.runner.name];
                          return `R${
                            game.round
                          } ${sideOneName} vs ${sideTwoName} (${
                            game.result === "runnerWin"
                              ? "runner win"
                              : game.result === "corpWin"
                              ? "corp win"
                              : "draw"
                          })`;
                        })
                        .filter(Boolean);

                      const hasTies = games.some(
                        (game) => game.result === "draw"
                      );

                      return (
                        <TableTd
                          key={sideTwoId}
                          pos="relative"
                          onMouseOver={() => {
                            games.length > 0 &&
                              setHoveredCoords({ row: i, col: j });
                          }}
                          onMouseLeave={() => {
                            setHoveredCoords({ row: -1, col: -1 });
                          }}
                          style={{
                            cursor: "default",
                            ...(games.length !== 0 && hovered && HOVER_STYLE),
                          }}
                        >
                          {games.length === 0 ? (
                            <Overlay backgroundOpacity={0} />
                          ) : (
                            <HoverCard>
                              <HoverCardTarget>
                                <Text size="sm">
                                  {sideOneWins.length}-{sideTwoWins.length}
                                  {hasTies &&
                                    `-${
                                      games.length -
                                      sideOneWins.length -
                                      sideTwoWins.length
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
      <Group justify="end">
        <Text>
          <Code>{mainSide} wins</Code>-
          <Code>{mainSide === "runner" ? "corp" : "runner"} wins</Code>
        </Text>
        <ActionIcon variant="default" onClick={() => switchSides()}>
          <IconTransfer style={{ width: "50%", height: "50%" }} />
        </ActionIcon>
      </Group>
    </Stack>
  );
}
