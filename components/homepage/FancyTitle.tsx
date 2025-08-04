import { Stack, Text, Title } from "@mantine/core";

export default function FancyTitle() {
  return (
    <Stack align="center" gap={0}>
      <Title order={1}>
        <Text
          inherit
          fw={900}
          variant="gradient"
          gradient={{ from: "orange", to: "yellow", deg: 30 }}
        >
          The Maker&#39;s Eye
        </Text>
      </Title>
      <Title order={4}>Netrunner tournament and meta analysis</Title>
    </Stack>
  );
}
