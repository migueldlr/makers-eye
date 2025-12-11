"use client";

import { memo, useState, type ReactNode } from "react";
import { Stack, Title } from "@mantine/core";
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

  return (
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
          onFlip={setFlipped}
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
      </Stack>
    </Slide>
  );
});
