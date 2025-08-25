import { Group, Radio, RadioGroup, Stack, Title } from "@mantine/core";
import { META_OPTIONS } from "../TournamentFilter";

export default function OnlineFilter({
  meta,
  cardpool,
  setMeta,
  setCardpool,
}: {
  meta: string;
  setMeta: (online: string) => void;
  cardpool: keyof typeof META_OPTIONS;
  setCardpool: (cardpool: keyof typeof META_OPTIONS) => void;
}) {
  return (
    <Stack gap="xs">
      <Title order={4}>Meta</Title>
      <RadioGroup
        value={cardpool}
        onChange={(value) => setCardpool(value as keyof typeof META_OPTIONS)}
      >
        <Group mt="xs">
          {Object.keys(META_OPTIONS).map((option) => (
            <Radio value={option} key={option} label={option} />
          ))}
        </Group>
      </RadioGroup>
      <RadioGroup value={meta} onChange={setMeta}>
        <Group mt="xs">
          {META_OPTIONS[cardpool].map((option) => (
            <Radio value={option} key={option} label={option} />
          ))}
        </Group>
      </RadioGroup>
    </Stack>
  );
}
