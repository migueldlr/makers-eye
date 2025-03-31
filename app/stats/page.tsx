import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Alert,
  Card,
  Center,
  Container,
  ScrollArea,
  Space,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import MatchupTable from "./MatchupTable";
import TournamentTable from "./TournamentTable";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { SITE_TITLE, TOURNAMENT_FILTER_KEY } from "@/lib/util";
import { IconInfoCircle } from "@tabler/icons-react";
import SummaryStats from "./SummaryStats";
import CorpSummary from "./CorpSummary";
import CorpRepresentation from "./CorpRepresentation";
import { BackButton } from "@/components/BackButton";
import TournamentFilter from "@/components/TournamentFilter";

export const metadata: Metadata = {
  title: `24.12 Meta Analysis | ${SITE_TITLE}`,
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const tournamentIds =
    params[TOURNAMENT_FILTER_KEY] == null
      ? undefined
      : (params[TOURNAMENT_FILTER_KEY] as string)
          .split(",")
          .map((id) => Number(id));

  const { data: tournaments } = await supabase.from("tournaments").select("*");

  return (
    <Container fluid px="lg" py="lg">
      <Stack display="block" pos="relative">
        <Title order={2}>24.12 Meta Analysis</Title>
        <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
          This page is under construction. Expect frequent updates.
        </Alert>

        <SummaryStats tournamentIds={tournamentIds} />

        <Title order={3}>Tournament filter</Title>

        <TournamentFilter tournaments={tournaments ?? []} />
        <Space h="md" />
        <Title order={4}>
          Included tournaments ({tournamentIds?.length ?? 0})
        </Title>
        <Space h="xs" />
        <ScrollArea h={400}>
          {tournaments == null ? (
            <div>Loading...</div>
          ) : (
            <TournamentTable
              tournaments={tournaments}
              tournamentIds={tournamentIds}
            />
          )}
        </ScrollArea>

        <Title order={3}>Corp representation</Title>
        <CorpRepresentation tournamentIds={tournamentIds} />
        <Title order={3}>Corp performance</Title>
        <CorpSummary />
        <Title order={3}>Matchup spread</Title>
        <MatchupTable />
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
