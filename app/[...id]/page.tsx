import { Tournament } from "../../lib/types";
import { Alert, Anchor, Container, Stack, Title } from "@mantine/core";
import { Players } from "../../components/players";
import { MatchupTable } from "../../components/MatchupTable";
import { createPlayerMap, augmentRounds } from "../../lib/tournament";
import { WinrateChart } from "../../components/WinrateChart";
import { IconAlertHexagon } from "@tabler/icons-react";
import { BackButton } from "../../components/BackButton";
import { RepresentationChart } from "../../components/RepresentationChart";
import { SITE_TITLE, URLS } from "@/lib/util";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const site = id[0] as keyof typeof URLS;
  const data = await fetch(`${URLS[site]}${id[1]}.json`);
  const tournament = (await data.json()) as Tournament;
  return {
    title: `${tournament.name} | ${SITE_TITLE}`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const site = id[0] as keyof typeof URLS;
  const isAesops = site === "aesops";

  const data = await fetch(`${URLS[site]}${id[1]}.json`);
  const tournament = (await data.json()) as Tournament;

  if ((tournament?.rounds?.length ?? 0) === 0) {
    return (
      <Container pt="md">
        <Stack>
          <Title order={2}>{tournament.name}</Title>
          <Alert
            variant="light"
            color="orange"
            title="No rounds found"
            icon={<IconAlertHexagon />}
          >
            This tournament might not be started yet. Check back later for
            results!
          </Alert>
          <BackButton />
        </Stack>
      </Container>
    );
  }

  const playerMap = createPlayerMap(tournament);

  const roundsAugmented = augmentRounds(tournament, isAesops, playerMap);

  return (
    <Container pt="md">
      <Stack>
        <Title order={2}>{tournament.name}</Title>
        <Anchor href={`${URLS[site]}${id[1]}`}>
          {`${URLS[site]}${id[1]}`}
        </Anchor>
        <RepresentationChart tournament={tournament} side="runner" />
        <WinrateChart
          tournament={tournament}
          roundsAugmented={roundsAugmented}
          side="runner"
        />
        <RepresentationChart tournament={tournament} side="corp" />
        <WinrateChart
          tournament={tournament}
          roundsAugmented={roundsAugmented}
          side="corp"
        />
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
