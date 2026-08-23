"use client";

import { ActionIcon, Collapse, Group, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { ReactNode, useState } from "react";

/**
 * Renders a section heading with an inline, collapsible explanation. The
 * button sits beside the title while the panel spans the card, so both live in
 * one client component rather than being threaded through the server parent.
 */
export default function SectionInfo({
  heading,
  info,
}: {
  heading: ReactNode;
  info?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Group gap={4} wrap="nowrap" align="center">
        {heading}
        {info != null && (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={open ? "Hide description" : "Show description"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <IconInfoCircle style={{ width: "80%", height: "80%" }} />
          </ActionIcon>
        )}
      </Group>

      {info != null && (
        <Collapse in={open}>
          <Text size="sm" c="dimmed" maw="70ch" mb="md">
            {/* Copy is authored as indented multi-line template literals, so
                collapse that incidental whitespace rather than relying on the
                browser's default white-space handling. */}
            {typeof info === "string" ? info.replace(/\s+/g, " ").trim() : info}
          </Text>
        </Collapse>
      )}
    </>
  );
}
