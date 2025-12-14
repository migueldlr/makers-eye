"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { Stack, Text, Title } from "@mantine/core";
import { motion, useInView } from "framer-motion";
import Slide from "./Slide";
import FlipCardWithReveal from "./FlipCardWithReveal";

interface FlipCardSlideProps {
  initialGradient: string;
  gradient: string;
  title: string;
  cardTitle: string;
  cardSubtitle: string;
  imageSrc: string;
  coverContent: ReactNode;
  coverMask?: string;
  revealTitle: string;
  revealSubtitle: string;
}

/**
 * Self-contained slide with flip card that manages its own flip state.
 * This isolates state changes from the parent component tree.
 */
export default memo(function FlipCardSlide({
  initialGradient,
  gradient,
  title,
  cardTitle,
  cardSubtitle,
  imageSrc,
  coverContent,
  coverMask,
  revealTitle,
  revealSubtitle,
}: FlipCardSlideProps) {
  const [flipped, setFlipped] = useState(false);
  const [hasEverClicked, setHasEverClicked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(slideRef, { amount: 0.5 });

  const handleFlip = useCallback(
    (isFlipped: boolean) => {
      setFlipped(isFlipped);
      if (!hasEverClicked) {
        setHasEverClicked(true);
        setShowHint(false);
      }
    },
    [hasEverClicked]
  );

  useEffect(() => {
    if (!isInView || hasEverClicked) return;

    const timer = setTimeout(() => {
      if (!hasEverClicked) {
        setShowHint(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isInView, hasEverClicked]);

  return (
    <div ref={slideRef}>
      <Slide
        initialGradient={initialGradient}
        gradient={gradient}
        showGradient={flipped}
      >
        <Stack align="center" gap="lg">
          <Title order={2}>{title}</Title>
          <FlipCardWithReveal
            imageSrc={imageSrc}
            cardTitle={cardTitle}
            cardSubtitle={cardSubtitle}
            coverContent={coverContent}
            coverMask={coverMask}
            onFlip={handleFlip}
          >
            <Stack align="center" gap="xs">
              <Title order={2} fw={700}>
                {revealTitle}
              </Title>
              <Title order={4} c="gray.5">
                {revealSubtitle}
              </Title>
            </Stack>
          </FlipCardWithReveal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showHint && !hasEverClicked ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginTop: -16 }}
          >
            <Text size="md" c="gray.6" ta="center">
              Click the card to reveal
            </Text>
          </motion.div>
        </Stack>
      </Slide>
    </div>
  );
});
