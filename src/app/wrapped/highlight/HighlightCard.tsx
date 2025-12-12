"use client";

import { useRef, useState } from "react";
import { Text, Stack, Title } from "@mantine/core";
import { motion } from "framer-motion";
import type { HighlightCardData, CardRect } from "./types";
import { formatDate } from "./utils";
import HighlightModal from "./HighlightModal";

export default function HighlightCard({
  title,
  value,
  highlight,
}: HighlightCardData) {
  const [opened, setOpened] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardRect, setCardRect] = useState<CardRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (highlight && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCardRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      setOpened(true);
      setIsAnimating(true);
    }
  };

  const handleClose = () => {
    setOpened(false);
    // Card stays hidden until exit animation completes
  };

  const handleExitComplete = () => {
    setIsAnimating(false);
  };

  // Card is hidden while modal is open OR while exit animation is playing
  const cardVisible = !opened && !isAnimating;

  const cardContent = (
    <motion.div
      ref={cardRef}
      onClick={handleOpen}
      style={{
        background: "rgba(20, 20, 30, 0.9)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        cursor: highlight ? "pointer" : "default",
        minWidth: 160,
        textAlign: "center",
        borderRadius: 16,
        padding: "1rem",
        opacity: cardVisible ? 1 : 0,
      }}
      whileHover={
        highlight
          ? {
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            }
          : undefined
      }
    >
      <Stack gap={4} align="center">
        <Text c="gray.5" fw={500}>
          {title}
        </Text>
        <Title order={2} c="white">
          {value}
        </Title>
        {highlight?.completedAt && (
          <Text size="xs" c="gray.6">
            {formatDate(highlight.completedAt)}
          </Text>
        )}
      </Stack>
    </motion.div>
  );

  if (!highlight) {
    return cardContent;
  }

  return (
    <>
      {cardContent}
      <HighlightModal
        opened={opened}
        onClose={handleClose}
        onExitComplete={handleExitComplete}
        title={title}
        value={value}
        highlight={highlight}
        cardRect={cardRect}
      />
    </>
  );
}
