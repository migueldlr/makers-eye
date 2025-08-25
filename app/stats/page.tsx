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
import MatchupTable from "../../components/stats/charts/MatchupTable";
import TournamentTable from "../../components/stats/TournamentTable";
import {
  DEFAULT_FORMAT,
  DEFAULT_META,
  FORMAT_FILTER_KEY,
  META_FILTER_KEY,
  SITE_TITLE,
} from "@/lib/util";
import SummaryStats from "../../components/stats/SummaryStats";
import MatchupSummary from "../../components/stats/wrappers/MatchupSummary";
import RepresentationChart from "../../components/stats/wrappers/RepresentationChart";
import { BackButton } from "@/components/common/BackButton";
import TournamentFilter from "@/components/stats/TournamentFilter";
import GameResultsSummary from "../../components/stats/charts/GameResultsSummary";
import WinrateSummary from "@/components/stats/wrappers/WinrateSummary";
import CutSwissComparison from "@/components/stats/wrappers/CutSwissComparison";
import TitleWithAnchor from "@/components/common/TitleWithAnchor";
import { parseTournamentParams } from "@/lib/params";
import { createClient } from "@/utils/supabase/server";
import { TournamentRow } from "@/lib/localtypes";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const meta = (params[META_FILTER_KEY] ?? DEFAULT_META) as string;
  const format = (params[FORMAT_FILTER_KEY] ?? DEFAULT_FORMAT) as string;
  return {
    title: `${meta} ${
      format !== DEFAULT_FORMAT && format
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

  const { tournamentIds, includeSwiss, includeCut, meta, format } =
    parseTournamentParams({ params, tournaments });

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

        <Accordion variant="separated">
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
                    tournamentIds={tournamentIds}
                    cardpool={format}
                  />
                )}
              </ScrollArea>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <TitleWithAnchor id="game-results">
          Game results summary
        </TitleWithAnchor>
        <GameResultsSummary
          tournamentIds={tournamentIds}
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <TitleWithAnchor id="corp-representation">
          Corp representation
        </TitleWithAnchor>
        <RepresentationChart
          tournamentIds={tournamentIds}
          side="corp"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <TitleWithAnchor id="corp-winrates">Corp winrates</TitleWithAnchor>
        <WinrateSummary
          tournamentIds={tournamentIds}
          side="corp"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <TitleWithAnchor id="corp-swiss-comparison">
          Corp swiss comparison
        </TitleWithAnchor>
        <CutSwissComparison tournamentIds={tournamentIds} side="corp" />

        <TitleWithAnchor id="corp-matchups">Corp matchups</TitleWithAnchor>
        <MatchupSummary
          tournamentIds={tournamentIds}
          side="corp"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <TitleWithAnchor id="runner-representation">
          Runner representation
        </TitleWithAnchor>
        <RepresentationChart
          tournamentIds={tournamentIds}
          side="runner"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <TitleWithAnchor id="runner-winrates">Runner winrates</TitleWithAnchor>
        <WinrateSummary
          tournamentIds={tournamentIds}
          side="runner"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <TitleWithAnchor id="runner-swiss-comparison">
          Runner swiss comparison
        </TitleWithAnchor>
        <CutSwissComparison tournamentIds={tournamentIds} side="runner" />

        <TitleWithAnchor id="runner-matchups">Runner matchups</TitleWithAnchor>
        <MatchupSummary
          tournamentIds={tournamentIds}
          side="runner"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <TitleWithAnchor id="matchup-spread">Matchup spread</TitleWithAnchor>
        <MatchupTable
          tournamentIds={tournamentIds}
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />
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
