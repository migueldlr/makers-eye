"use client";

import { ActionIcon, Box, Group, Title, TitleOrder } from "@mantine/core";
import { IconCheck, IconLink } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useRef, useState } from "react";

export default function TitleWithAnchor({
  id,
  order = 3,
  children,
}: PropsWithChildren<{ id: string; order?: TitleOrder }>) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const ref = useRef<number | null>(null);

  const copy = async (text: string) => {
    if (!navigator.userAgent.includes("Firefox")) {
      await navigator.permissions.query({
        // @ts-ignore
        name: "clipboard-write",
      });
    }

    await navigator.clipboard.writeText(text);
  };

  const onClick = () => {
    setClicked(true);
    navigator.clipboard.writeText(id);
    if (ref.current) clearTimeout(ref.current);
    ref.current = window.setTimeout(() => {
      setClicked(false);
    }, 1000);

    const { location } = window;
    const url = `${location.protocol}//${location.host}${location.pathname}${location.search}#${id}`;

    copy(url);
  };
  return (
    <Group
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setClicked(false);
      }}
      gap="xs"
      my="sm"
    >
      <Title order={order} style={{ cursor: "default" }} id={id}>
        {children}
      </Title>
      {hovered && (
        <ActionIcon variant="light" color="orange" onClick={() => onClick()}>
          {clicked ? (
            <IconCheck style={{ width: "70%", height: "70%" }} />
          ) : (
            <IconLink style={{ width: "70%", height: "70%" }} />
          )}
        </ActionIcon>
      )}
    </Group>
  );
}
