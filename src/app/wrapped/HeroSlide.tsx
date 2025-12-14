"use client";

import { ActionIcon, Stack, Text, Title } from "@mantine/core";
import { IconArrowDown, IconX } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Slide from "./Slide";

interface HeroSlideProps {
  username: string | null;
  gravatarUrl: string | null;
  onReset: () => void;
}

const baseFont = "'Geist', sans-serif";

export default function HeroSlide({
  username,
  gravatarUrl,
  onReset,
}: HeroSlideProps) {
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Slide gradient="radial-gradient(circle, #0c0b1d, #02010a)">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="md"
        onClick={onReset}
        style={{ position: "absolute", top: 16, right: 16 }}
        aria-label="Close"
      >
        <IconX style={{ width: "70%", height: "70%" }} />
      </ActionIcon>
      <Stack align="center" gap="sm">
        <Title
          order={1}
          ta="center"
          size={64}
          style={{ fontFamily: baseFont, lineHeight: 1.05 }}
        >
          Hey, {username ?? "Welcome back"}.
        </Title>
        <Text size="xl" ta="center">
          Welcome to your Jnet Wrapped 2025.
        </Text>
        {gravatarUrl && (
          <img
            src={gravatarUrl}
            alt={`${username}'s avatar`}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
            }}
          />
        )}
      </Stack>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollHint ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Stack align="center" gap="xs">
          <Text size="sm" c="gray.6" ta="center">
            Scroll or arrow down to continue
          </Text>
          <IconArrowDown
            color="gray"
            style={{ width: "20px", height: "20px" }}
          />
        </Stack>
      </motion.div>
    </Slide>
  );
}
