"use client";

import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import WheelGesturesPlugin from "embla-carousel-wheel-gestures";
import { Box, Paper, Stack, Text } from "@mantine/core";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SummaryEmblaApi = {
  selectedScrollSnap: () => number;
  slideNodes: () => HTMLElement[];
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
};

export interface SummaryStat {
  label: string;
  value: string;
}

interface SummaryCarouselProps {
  stats: SummaryStat[];
  width?: string | number;
  slideSize?: string | number;
}

export default function SummaryCarousel({
  stats,
  width = "400px",
  slideSize = "300px",
}: SummaryCarouselProps) {
  const wheelGesturesPlugin = useRef(WheelGesturesPlugin());
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 5000,
      playOnInit: false,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [embla, setEmbla] = useState<SummaryEmblaApi | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);

  const summarySlides = useMemo<ReactNode[]>(
    () =>
      stats.map((stat) => (
        <Carousel.Slide key={stat.label}>
          <Paper
            withBorder
            radius="lg"
            p="xl"
            h="100%"
            style={{
              background: "rgba(7, 6, 19, 0.75)",
            }}
          >
            <Stack align="center" gap="xs">
              <Text
                fw={700}
                c="gray.0"
                ta="center"
                style={{ fontSize: "2.5rem", lineHeight: 1.1 }}
              >
                {stat.value}
              </Text>
              <Text
                size="sm"
                c="gray.5"
                fw={600}
                style={{ letterSpacing: 1, textAlign: "center" }}
              >
                {stat.label}
              </Text>
            </Stack>
          </Paper>
        </Carousel.Slide>
      )),
    [stats]
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          autoplayPlugin.current?.play();
        } else {
          autoplayPlugin.current?.stop();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const updateSlideOpacity = useCallback((api: SummaryEmblaApi) => {
    api.slideNodes().forEach((node, index) => {
      if (!node.style.transition) {
        node.style.transition = "opacity 250ms ease";
      }
      node.style.opacity = index === api.selectedScrollSnap() ? "1" : "0.5";
    });
  }, []);

  useEffect(() => {
    if (!embla) return;
    const handler = () => updateSlideOpacity(embla);
    handler();
    embla.on("select", handler);
    embla.on("scroll", handler);
    embla.on("reInit", handler);
    return () => {
      embla.off("select", handler);
      embla.off("scroll", handler);
      embla.off("reInit", handler);
    };
  }, [embla, updateSlideOpacity]);

  const captureEmbla = useCallback((api: unknown) => {
    setEmbla(api as SummaryEmblaApi);
  }, []);

  const handleMouseEnter = () => {
    setControlsVisible(true);
    autoplayPlugin.current?.stop();
  };

  const handleMouseLeave = () => {
    setControlsVisible(false);
    autoplayPlugin.current?.play();
  };

  return (
    <Box w={width} ref={containerRef}>
      <Carousel
        withControls
        slideSize={slideSize}
        slideGap="lg"
        emblaOptions={{ loop: true, align: "center" }}
        plugins={[wheelGesturesPlugin.current, autoplayPlugin.current]}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        getEmblaApi={captureEmbla}
        styles={{
          controls: {
            opacity: controlsVisible ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: controlsVisible ? "auto" : "none",
          },
        }}
      >
        {summarySlides}
      </Carousel>
    </Box>
  );
}
