"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Carousel } from "@mantine/carousel";
import { Text } from "@mantine/core";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { motion, useInView } from "framer-motion";
import { HighlightCard, type HighlightCardData } from "./highlight";

interface HighlightCarouselProps {
  items: HighlightCardData[];
}

export default function HighlightCarousel({ items }: HighlightCarouselProps) {
  const [hasEverExpanded, setHasEverExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.5 });

  const handleExpand = useCallback(() => {
    if (!hasEverExpanded) {
      setHasEverExpanded(true);
      setShowHint(false);
    }
  }, [hasEverExpanded]);

  useEffect(() => {
    if (!isInView || hasEverExpanded) return;

    const timer = setTimeout(() => {
      if (!hasEverExpanded) {
        setShowHint(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isInView, hasEverExpanded]);

  // Filter out items without highlights and sort by date (oldest first)
  const validItems = items
    .filter((item) => item.highlight !== null)
    .sort((a, b) => {
      const dateA = a.highlight?.completedAt
        ? new Date(a.highlight.completedAt).getTime()
        : 0;
      const dateB = b.highlight?.completedAt
        ? new Date(b.highlight.completedAt).getTime()
        : 0;
      return dateA - dateB;
    });

  if (validItems.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef}>
      <Carousel
        slideSize="auto"
        slideGap="md"
        withControls
        controlSize={32}
        plugins={[WheelGesturesPlugin()]}
        emblaOptions={{
          dragFree: true,
          align: "center",
          containScroll: false,
        }}
        styles={{
          root: {
            width: "100%",
          },
          viewport: {
            overflowY: "visible",
          },
          container: {
            overflowY: "visible",
          },
          control: {
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
          },
        }}
      >
        {validItems.map((item) => (
          <Carousel.Slide
            key={item.title}
            style={{ paddingTop: 8, paddingBottom: 32 }}
          >
            <HighlightCard {...item} onExpand={handleExpand} />
          </Carousel.Slide>
        ))}
      </Carousel>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showHint && !hasEverExpanded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginTop: -16, textAlign: "center" }}
      >
        <Text size="md" c="gray.6">
          Click the cards to expand
        </Text>
      </motion.div>
    </div>
  );
}
