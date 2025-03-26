import { Container, Stack } from "@mantine/core";
import MatchupTable from "./MatchupTable";

export default function StatsPage() {
  return (
    <Container fluid pt="lg">
      <Stack>
        <MatchupTable />
      </Stack>
    </Container>
  );
}
