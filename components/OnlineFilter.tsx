import { Checkbox, CheckboxGroup, Group, Stack, Title } from "@mantine/core";
import { ONLINE_OPTIONS } from "./TournamentFilter";

export default function OnlineFilter({
  online,
  setOnline,
}: {
  online: string[];
  setOnline: (online: string[]) => void;
}) {
  return (
    <Stack gap="xs">
      <Title order={4}>Location</Title>
      <CheckboxGroup value={online} onChange={setOnline}>
        <Group mt="xs">
          {ONLINE_OPTIONS.map((option) => (
            <Checkbox value={option} key={option} label={option} />
          ))}
        </Group>
      </CheckboxGroup>
    </Stack>
  );
}
