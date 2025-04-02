import { Checkbox, CheckboxGroup, Group, Stack, Title } from "@mantine/core";
import { ALL_REGION_OPTIONS } from "../../TournamentFilter";

export default function RegionFilter({
  regions,
  setRegions,
}: {
  regions: string[];
  setRegions: (regions: string[]) => void;
}) {
  return (
    <Stack gap="xs">
      <Title order={4}>Region</Title>
      <CheckboxGroup value={regions} onChange={setRegions}>
        <Group mt="xs">
          {ALL_REGION_OPTIONS.map((region) => (
            <Checkbox value={region} key={region} label={region} />
          ))}
        </Group>
      </CheckboxGroup>
    </Stack>
  );
}
