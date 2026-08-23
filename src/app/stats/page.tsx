import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Center,
  Container,
  ScrollArea,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import MatchupTable from "@/components/stats/charts/MatchupTable";
import TournamentTable from "@/components/stats/TournamentTable";
import {
  DEFAULT_FORMAT,
  DEFAULT_META,
  FORMAT_FILTER_KEY,
  META_FILTER_KEY,
  SITE_TITLE,
} from "@/lib/util";
import SummaryStats from "@/components/stats/SummaryStats";
import { BackButton } from "@/components/common/BackButton";
import TournamentFilter from "@/components/stats/TournamentFilter";
import GameResultsSummary from "@/components/stats/charts/GameResultsSummary";
import ChartSection from "@/components/stats/ChartSection";
import SideSections from "@/components/stats/SideSections";
import SideTabs from "@/components/stats/SideTabs";
import { parseTournamentParams } from "@/lib/params";
import { createClient } from "@/utils/supabase/server";
import { TournamentRow } from "@/lib/localtypes";
import MarkovAnalysis from "@/components/stats/wrappers/MarkovAnalysis";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const meta = (params[META_FILTER_KEY] ?? DEFAULT_META) as string;
  const format = (params[FORMAT_FILTER_KEY] ?? DEFAULT_FORMAT) as string;

  return {
    title: `${meta}${
      format !== DEFAULT_FORMAT ? ` ${format}` : ""
    } Meta Analysis | ${SITE_TITLE}`,
  };
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();

  const res = await supabase.from("tournaments_with_player_count").select("*");
  const tournaments = res.data as TournamentRow[];

  const {
    tournamentIds: unexcludedTournamentIds,
    includeSwiss,
    includeCut,
    meta,
    format,
    excludeIds,
  } = parseTournamentParams({ params, tournaments });

  const tournamentIds = unexcludedTournamentIds.filter(
    (id) => !excludeIds?.includes(id)
  );

  return (
    <Container fluid px="lg" py="lg">
      <Stack display="block" pos="relative">
        <Title order={2} mb="sm">
          {meta} {format !== DEFAULT_FORMAT && format} Meta Analysis
        </Title>
        {/* <Alert variant="light" color="orange" icon={<IconInfoCircle />}>
          This page is under construction. Expect frequent updates.
        </Alert> */}

        <BackButton />
        <Space h="sm" />

        <TournamentFilter tournaments={tournaments ?? []} />
        <Space h="sm" />
        <SummaryStats tournamentIds={tournamentIds} />

        <Space h="md" />

        <Accordion variant="separated" mb="lg">
          <AccordionItem value="tournaments">
            <AccordionControl>
              <Title id="tournaments" order={3}>
                Included tournaments ({tournamentIds?.length ?? 0})
              </Title>
            </AccordionControl>
            <AccordionPanel>
              <ScrollArea h={400}>
                {tournaments == null ? (
                  <div>Loading...</div>
                ) : (
                  <TournamentTable
                    meta={meta}
                    tournaments={tournaments}
                    tournamentIds={unexcludedTournamentIds}
                    cardpool={format}
                    excludeIds={excludeIds}
                  />
                )}
              </ScrollArea>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <ChartSection id="game-results" title="Game results summary">
          <GameResultsSummary
            tournamentIds={tournamentIds}
            includeCut={includeCut}
            includeSwiss={includeSwiss}
          />
        </ChartSection>

        <SideTabs
          corp={
            <SideSections
              side="corp"
              tournamentIds={tournamentIds}
              includeCut={includeCut}
              includeSwiss={includeSwiss}
            />
          }
          runner={
            <SideSections
              side="runner"
              tournamentIds={tournamentIds}
              includeCut={includeCut}
              includeSwiss={includeSwiss}
            />
          }
        />

        <ChartSection id="matchup-spread" title="Matchup spread">
          <MatchupTable
            tournamentIds={tournamentIds}
            includeCut={includeCut}
            includeSwiss={includeSwiss}
          />
        </ChartSection>

        <ChartSection id="markov" title="Markov Chain Rankings">
          <MarkovAnalysis
            tournamentIds={tournamentIds}
            includeCut={includeCut}
            includeSwiss={includeSwiss}
          />
        </ChartSection>

        <Space h="xl" />
        <BackButton />
      </Stack>
      <Center>
        <Text mt="2em" c="gray.7">
          created by spiderbro
        </Text>
      </Center>
    </Container>
  );
}
