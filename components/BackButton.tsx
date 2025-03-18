"use client";

import { Group, NavLink } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <Group justify="start" w="fit-content">
      <NavLink
        href="/"
        label="Back to home"
        leftSection={<IconArrowLeft size={16} stroke={1.5} />}
        onClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
      />
    </Group>
  );
}
