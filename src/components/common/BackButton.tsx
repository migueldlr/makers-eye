import { Button, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export function BackButton() {
  return (
    <Group justify="start" w="fit-content">
      <Button
        component={Link}
        href="/"
        leftSection={<IconArrowLeft size={16} stroke={1.5} />}
        variant="outline"
        color="orange"
        size="sm"
      >
        Back to home
      </Button>
    </Group>
  );
}
