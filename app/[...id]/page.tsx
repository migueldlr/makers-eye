import { Player, Tournament } from "../../lib/types";
import { Container, Stack, Title } from "@mantine/core";
import { Players } from "../../components/players";
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

  return (
    <Container pt="md">
      <Stack>
        <Title order={2}>{tournament.name}</Title>
        <Players tournament={tournament} isAesops={isAesops} />
      </Stack>
    </Container>
  );
}
