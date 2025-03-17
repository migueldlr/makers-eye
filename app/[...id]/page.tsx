import { Player, Tournament } from "../../lib/types";
import { Container, Stack, Title } from "@mantine/core";
import { Players } from "../../components/players";
import { IdentityStats } from "../../components/identitystats";
import { createPlayerMap, augmentRounds } from "../../lib/tournament";

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
  console.log(roundsAugmented[2]);

  return (
    <Container pt="md">
      <Stack>
        <Title order={2}>{tournament.name}</Title>
        <IdentityStats roundsAugmented={roundsAugmented} />
        <Players
          tournament={tournament}
          roundsAugmented={roundsAugmented}
          playerMap={playerMap}
        />
      </Stack>
    </Container>
  );
}
