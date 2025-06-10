"use client";

import { Button, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

export function BackButton() {
  const [hovering, setHovering] = useState(false);
  return (
    <Group justify="start" w="fit-content">
      <Button
        component={Link}
        href="/"
        leftSection={<IconArrowLeft size={16} stroke={1.5} />}
        variant="outline"
        color="orange"
        size="sm"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {hovering ? "Back to home" : "Jack out"}
      </Button>
    </Group>
  );
}
