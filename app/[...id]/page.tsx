import { Tournament } from "../../lib/types";
import { Container, Group, NavLink, Stack, Title } from "@mantine/core";
import { Players } from "../../components/players";
import { MatchupTable } from "../../components/MatchupTable";
import { createPlayerMap, augmentRounds } from "../../lib/tournament";
import { WinrateChart } from "../../components/WinrateChart";
import { IconArrowLeft } from "@tabler/icons-react";
import { BackButton } from "../../components/BackButton";
import { ConversionChart } from "../../components/ConversionChart";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const urls = {
    cobra: `https://tournaments.nullsignal.games/tournaments/`,
    aesops: `https://www.aesopstables.net/`,
  };
  const site = id[0] as keyof typeof urls;
  const isAesops = site === "aesops";

  const data = await fetch(`${urls[site]}${id[1]}.json`);
  const tournament = (await data.json()) as Tournament;

  const playerMap = createPlayerMap(tournament);

  const roundsAugmented = augmentRounds(tournament, isAesops, playerMap);

  return (
    <Container pt="md">
      <Stack>
        <Title order={2}>{tournament.name}</Title>
        <ConversionChart tournament={tournament} side="runner" />
        <WinrateChart roundsAugmented={roundsAugmented} side="runner" />
        <ConversionChart tournament={tournament} side="corp" />
        <WinrateChart roundsAugmented={roundsAugmented} side="corp" />
        <MatchupTable roundsAugmented={roundsAugmented} />
        <Players
          tournament={tournament}
          roundsAugmented={roundsAugmented}
          playerMap={playerMap}
        />
        <BackButton />
      </Stack>
    </Container>
  );
}
