import {
  Alert,
  Center,
  Container,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import MatchupTable from "./MatchupTable";
import TournamentTable from "./TournamentTable";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { SITE_TITLE } from "@/lib/util";
import { IconInfoCircle } from "@tabler/icons-react";
import SummaryStats from "./SummaryStats";
import CorpSummary from "./CorpSummary";
import CorpRepresentation from "./CorpRepresentation";
import { BackButton } from "@/components/BackButton";
import TournamentFilter from "@/components/TournamentFilter";

export const metadata: Metadata = {
  title: `24.12 Meta Analysis | ${SITE_TITLE}`,
};

export default async function StatsPage() {
  const supabase = await createClient();

  const { data: tournaments } = await supabase.from("tournaments").select("*");
  return (
    <Container fluid px="lg" py="lg">
      <Stack>
        <Title order={2}>24.12 Meta Analysis</Title>
        <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
          This page is under construction. Expect frequent updates.
        </Alert>
        <SummaryStats />
        <TournamentFilter tournaments={tournaments ?? []} />
        <Title order={3}>Corp representation</Title>
        <CorpRepresentation />
        <Title order={3}>Corp performance</Title>
        <CorpSummary />
        <Title order={3}>Matchup spread</Title>
        <MatchupTable />
        <Title order={3}>
          Included tournaments ({tournaments?.length ?? 0})
        </Title>
        <ScrollArea h={400}>
          {tournaments == null ? (
            <div>Loading...</div>
          ) : (
            <TournamentTable tournaments={tournaments} />
          )}
        </ScrollArea>
        <BackButton />
      </Stack>
      <Center>
        <Text mt="40vh" c="gray.7">
          created by spiderbro
        </Text>
      </Center>
    </Container>
  );
}
