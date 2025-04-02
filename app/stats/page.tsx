import {
  Alert,
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
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import {
  DEFAULT_NONE,
  END_DATE_FILTER_KEY,
  isWithinDateRange,
  ONLINE_FILTER_KEY,
  PHASE_FILTER_KEY,
  REGION_FILTER_KEY,
  SITE_TITLE,
  START_DATE_FILTER_KEY,
} from "@/lib/util";
import { IconInfoCircle } from "@tabler/icons-react";
import SummaryStats from "../../components/stats/SummaryStats";
import MatchupSummary from "../../components/stats/wrappers/MatchupSummary";
import RepresentationChart from "../../components/stats/wrappers/RepresentationChart";
import { BackButton } from "@/components/common/BackButton";
import TournamentFilter from "@/components/stats/TournamentFilter";
import { TournamentRow } from "@/lib/localtypes";
import GameResultsSummary from "../../components/stats/charts/GameResultsSummary";
import WinrateSummary from "@/components/stats/wrappers/WinrateSummary";
import CutSwissComparison from "@/components/stats/wrappers/CutSwissComparison";
import TitleWithAnchor from "@/components/common/TitleWithAnchor";

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

  const res = await supabase.from("tournaments_with_player_count").select("*");
  const tournaments = res.data as TournamentRow[];
  const startDate = (params[START_DATE_FILTER_KEY] ?? "") as string;
  const endDate = (params[END_DATE_FILTER_KEY] ?? "") as string;
  const region = (params[REGION_FILTER_KEY] ?? "") as string;
  const online = (params[ONLINE_FILTER_KEY] ?? "") as string;
  const tournamentIds = tournaments
    ?.filter((t) => isWithinDateRange(startDate, endDate, t.date))
    .filter((t) =>
      region === ""
        ? true
        : region.split(",").includes(t.region ?? DEFAULT_NONE)
    )
    .filter((t) =>
      online === "" ? true : online.split(",").includes(t.location ?? "Paper")
    )
    .map((t) => t.id);

  const phase = (params[PHASE_FILTER_KEY] ?? "") as string;
  const includeSwiss = phase.length === 0 || phase.split(",").includes("Swiss");
  const includeCut = phase.length === 0 || phase.split(",").includes("Cut");

  return (
    <Container fluid px="lg" py="lg">
      <Stack display="block" pos="relative">
        <Title order={2} mb="sm">
          24.12 Meta Analysis
        </Title>
        <Alert variant="light" color="orange" icon={<IconInfoCircle />}>
          This page is under construction. Expect frequent updates.
        </Alert>
        <Space h="sm" />

        <TournamentFilter tournaments={tournaments ?? []} />
        <Space h="sm" />
        <SummaryStats tournamentIds={tournamentIds} />

        <Space h="md" />
        <TitleWithAnchor id="tournaments">
          Included tournaments ({tournamentIds?.length ?? 0})
        </TitleWithAnchor>
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

        <TitleWithAnchor id="corp-cut-vs-swiss">
          Corp cut vs swiss
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

        <TitleWithAnchor id="runner-cut-vs-swiss">
          Runner cut vs swiss
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
