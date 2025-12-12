"use client";

import { Stack, Text, Tooltip } from "@mantine/core";
import type { TopOpponent } from "@/lib/wrapped/types";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import AutoScroll from "embla-carousel-auto-scroll";
import { useMemo } from "react";

interface RivalsHexGridProps {
  rivals: TopOpponent[];
}

// Seeded random shuffle for consistent ordering
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function RivalsHexGrid({ rivals }: RivalsHexGridProps) {
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "start",
      containScroll: false,
    },
    [
      WheelGesturesPlugin(),
      AutoScroll({
        speed: 1,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    ]
  );

  // Shuffle rivals with a consistent seed based on length
  const shuffledRivals = useMemo(
    () => seededShuffle(rivals, rivals.length),
    [rivals]
  );

  const hexSize = 26;
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * 2;
  const rows = 3;
  const cols = Math.ceil(shuffledRivals.length / rows);
  // Calculate exact width so grids tile seamlessly
  const colSpacing = hexWidth * 1.1;
  const gridWidth = cols * colSpacing;
  const gridHeight = rows * hexHeight * 1.05 + hexHeight * 0.3;

  const renderGrid = (keyPrefix: string) => (
    <div
      style={{
        position: "relative",
        width: gridWidth,
        height: gridHeight,
        flexShrink: 0,
      }}
    >
      {shuffledRivals.map((opponent, index) => {
        const row = index % rows;
        const col = Math.floor(index / rows);
        const isOddRow = row % 2 === 1;
        const x = col * colSpacing + (isOddRow ? colSpacing / 2 : 0);
        const y = row * hexHeight * 1.05;

        const gravatarUrl = opponent.emailHash
          ? `https://gravatar.com/avatar/${opponent.emailHash}?s=120&d=retro`
          : `https://gravatar.com/avatar/?s=120&d=retro`;

        return (
          <Tooltip
            key={`${keyPrefix}-${opponent.username}`}
            label={
              <Stack gap={2}>
                <Text size="sm" fw={600}>
                  {opponent.username}
                </Text>
                <Text size="xs">{opponent.games} games</Text>
              </Stack>
            }
            withArrow
          >
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
              }}
            >
              <img
                src={gravatarUrl}
                alt={opponent.username}
                style={{
                  width: hexSize * 2,
                  height: hexSize * 2,
                  borderRadius: (hexSize * 2 * 3) / 22,
                }}
              />
            </div>
          </Tooltip>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <div ref={emblaRef} style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            padding: "1rem 0",
          }}
        >
          {renderGrid("a")}
          {renderGrid("b")}
          {renderGrid("c")}
        </div>
      </div>
    </div>
  );
}
