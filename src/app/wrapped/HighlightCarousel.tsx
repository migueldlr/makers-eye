"use client";

import { Carousel } from "@mantine/carousel";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { HighlightCard, type HighlightCardData } from "./highlight";

interface HighlightCarouselProps {
  items: HighlightCardData[];
}

export default function HighlightCarousel({ items }: HighlightCarouselProps) {
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
    <Carousel
      slideSize="auto"
      slideGap="md"
      withControls
      controlSize={32}
      plugins={[WheelGesturesPlugin()]}
      emblaOptions={{
        dragFree: true,
        align: "center",
        slidesToScroll: 2,
        containScroll: false,
        loop: true,
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
          <HighlightCard {...item} />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}
