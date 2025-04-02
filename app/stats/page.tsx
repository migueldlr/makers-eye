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
        <Title order={4} mb="sm">
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

        <GameResultsSummary
          tournamentIds={tournamentIds}
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <Title order={3} my="sm">
          Corp representation
        </Title>
        <RepresentationChart
          tournamentIds={tournamentIds}
          side="corp"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <Title order={3} my="sm">
          Corp winrates
        </Title>
        <WinrateSummary
          tournamentIds={tournamentIds}
          side="corp"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <Title order={3} my="sm">
          Corp cut vs swiss
        </Title>
        <CutSwissComparison tournamentIds={tournamentIds} side="corp" />

        <Title order={3} my="sm">
          Corp matchups
        </Title>
        <MatchupSummary
          tournamentIds={tournamentIds}
          side="corp"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <Title order={3} my="sm">
          Runner representation
        </Title>
        <RepresentationChart
          tournamentIds={tournamentIds}
          side="runner"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <Title order={3} my="sm">
          Runner winrates
        </Title>
        <WinrateSummary
          tournamentIds={tournamentIds}
          side="runner"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />

        <Title order={3} my="sm">
          Runner matchups
        </Title>
        <MatchupSummary
          tournamentIds={tournamentIds}
          side="runner"
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />
        <Title order={3} my="sm">
          Matchup spread
        </Title>
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
