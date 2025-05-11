import { Group, Radio, RadioGroup, Stack, Title } from "@mantine/core";
import { META_OPTIONS } from "../TournamentFilter";

export default function OnlineFilter({
  meta,
  setMeta,
}: {
  meta: string;
  setMeta: (online: string) => void;
}) {
  return (
    <Stack gap="xs">
      <Title order={4}>Meta</Title>
      <RadioGroup value={meta} onChange={setMeta}>
        <Group mt="xs">
          {META_OPTIONS.map((option) => (
            <Radio value={option} key={option} label={option} />
          ))}
        </Group>
      </RadioGroup>
    </Stack>
  );
}
