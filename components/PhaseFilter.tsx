import { Stack, Title, CheckboxGroup, Group, Checkbox } from "@mantine/core";
import { PHASE_OPTIONS } from "./TournamentFilter";

export default function PhaseFilter({
  phase,
  setPhase,
}: {
  phase: string[];
  setPhase: (phase: string[]) => void;
}) {
  return (
    <Stack gap="xs">
      <Title order={4}>Phase</Title>
      <CheckboxGroup value={phase} onChange={setPhase}>
        <Group mt="xs">
          {PHASE_OPTIONS.map((option) => (
            <Checkbox value={option} key={option} label={option} />
          ))}
        </Group>
      </CheckboxGroup>
    </Stack>
  );
}
