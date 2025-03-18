"use client";

import {
  ActionIcon,
  Center,
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
  Tooltip,
} from "@mantine/core";
import {
  AugmentedRound,
  getUniqueCorps,
  getUniqueRunners,
  groupGamesByCorp,
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
  const gamesBySideOneId = Object.entries(groupRoundsByRunner(roundsAugmented));
  const gamesBySideTwoId = Object.entries(groupRoundsByCorp(roundsAugmented));

  const playersBySideOneId = groupPlayersByRunner(
    groupRoundsByRunner(roundsAugmented)
  );
  const playersBySideTwoId = groupPlayersByCorp(
    groupRoundsByCorp(roundsAugmented)
  );
  const allSideOneIds = getUniqueRunners(roundsAugmented);
  const allSideTwoIds = getUniqueCorps(roundsAugmented);

  function FillerTd({ count }: { count: number }) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <TableTd key={i}></TableTd>
        ))}
      </>
    );
  }

  return (
    <Table>
      <TableThead>
        <TableTr>
          <FillerTd count={2} />
          {allSideTwoIds.map((sideTwoId, i) => {
            const players = playersBySideTwoId[sideTwoId].map(
              (player) => player.name
            );
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
          {gamesBySideTwoId.map(([sideTwoId, games]) => {
            const sideOneWins = games.filter(
              (game) => game.result === "runnerWin"
            );
            const sideTwoWins = games.filter(
              (game) => game.result === "corpWin"
            );
            return (
              <TableTd key={sideTwoId} style={{ cursor: "default" }}>
                {sideOneWins.length}-{sideTwoWins.length}
              </TableTd>
            );
          })}
        </TableTr>
        {gamesBySideOneId.map(([sideOneId, games], i) => {
          const groupedGames = groupGamesByCorp(games);
          const sideOneWins = games.filter(
            (game) => game.result === "runnerWin"
          );
          const sideTwoWins = games.filter((game) => game.result === "corpWin");
          const players = playersBySideOneId[sideOneId].map(
            (player) => player.name
          );
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
                {sideOneWins.length}-{sideTwoWins.length}
              </TableTd>
              {allSideTwoIds.map((sideTwoId, j) => {
                const games = groupedGames[sideTwoId] ?? [];
                const sideOneWins = games.filter(
                  (game) => game.result === "runnerWin"
                );
                const sideTwoWins = games.filter(
                  (game) => game.result === "corpWin"
                );

                const hovered =
                  hoveredCoords.row === i && hoveredCoords.col === j;
                const results = games.map((game) => {
                  return `R${game.round} ${game.runner.name} vs ${
                    game.corp.name
                  } (${
                    game.result === "runnerWin"
                      ? "runner win"
                      : game.result === "corpWin"
                      ? "corp win"
                      : "draw"
                  })`;
                });

                const hasTies = games.some((game) => game.result === "draw");

                return (
                  <TableTd
                    key={sideTwoId}
                    pos="relative"
                    onMouseOver={() => {
                      games.length > 0 && setHoveredCoords({ row: i, col: j });
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
  );
}

/*

      <Group justify="end">
        <Tooltip label="Switch sides">
          <ActionIcon variant="default">
            <IconTransfer style={{ width: "50%", height: "50%" }} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Stack>
*/
