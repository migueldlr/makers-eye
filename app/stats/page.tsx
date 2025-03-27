import { Container, ScrollArea, Stack, Title } from "@mantine/core";
import MatchupTable from "./MatchupTable";
import TournamentTable from "./TournamentTable";
import { createClient } from "@/utils/supabase/server";

export default async function StatsPage() {
  const supabase = await createClient();

  const { data: tournaments } = await supabase.from("tournaments").select("*");
  return (
    <Container fluid py="lg">
      <Stack>
        <MatchupTable />
        <Title order={4}>Included tournaments</Title>
        <ScrollArea h={400}>
          {tournaments == null ? (
            <div>Loading...</div>
          ) : (
            <TournamentTable tournaments={tournaments} />
          )}
        </ScrollArea>
      </Stack>
    </Container>
  );
}
