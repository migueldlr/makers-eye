"use client";

import { Box, Title, Tooltip } from "@mantine/core";
import { useRef, useEffect, useCallback } from "react";
import type { GameRecord } from "@/lib/wrapped/types";
import {
  shortenId,
  idToFaction,
  factionToColor,
  FACTION_NAMES,
} from "@/lib/util";
import { useMemo } from "react";

interface GameDot {
  id: number;
  color: string;
  isWin: boolean;
  identity: string;
  opponentIdentity: string;
  opponentName: string;
  completedAt: Date | null;
  faction: string;
}

interface GameDotsGridProps {
  games: GameRecord[];
  username: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

// Simple linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Dot component with ref for direct DOM manipulation
function Dot({
  dot,
  dotSize,
  initialX,
  initialY,
  onRef,
}: {
  dot: GameDot;
  dotSize: number;
  initialX: number;
  initialY: number;
  onRef: (id: number, el: HTMLDivElement | null) => void;
}) {
  return (
    <Tooltip
      label={
        <>
          {dot.completedAt && (
            <>
              {new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
              }).format(new Date(dot.completedAt))}
              {" - "}
            </>
          )}
          {dot.identity} vs {dot.opponentIdentity} ({dot.opponentName}) -{" "}
          <span style={{ color: dot.isWin ? "#4caf50" : "#f44336" }}>
            {dot.isWin ? "Win" : "Loss"}
          </span>
        </>
      }
      withArrow
      position="top"
    >
      <div
        ref={(el) => onRef(dot.id, el)}
        style={{
          position: "absolute",
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: dot.color,
          cursor: "pointer",
          transform: `translate3d(${initialX}px, ${initialY}px, 0)`,
          willChange: "transform",
        }}
      />
    </Tooltip>
  );
}

export default function GameDotsGrid({ games, username, scrollContainerRef }: GameDotsGridProps) {
  const DOT_SIZE = 8;
  const DOT_GAP = 3;
  const MAX_WIDTH = 600;
  const DOTS_PER_ROW = Math.floor((MAX_WIDTH + DOT_GAP) / (DOT_SIZE + DOT_GAP));
  const FULL_ROW_WIDTH = DOTS_PER_ROW * DOT_SIZE + (DOTS_PER_ROW - 1) * DOT_GAP;

  const containerRef = useRef<HTMLDivElement>(null);

  // Store dot elements for direct DOM manipulation
  const dotElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Callback to register dot refs
  const handleDotRef = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) {
      dotElementsRef.current.set(id, el);
    } else {
      dotElementsRef.current.delete(id);
    }
  }, []);

  // Create dots with stable IDs (sorted chronologically)
  const dots = useMemo<GameDot[]>(() => {
    const sortedGames = [...games].sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return (
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
    });

    return sortedGames.map((game, index) => {
      const isRunner = game.runner.username === username;
      const identity = isRunner ? game.runner.identity : game.corp.identity;
      const opponentIdentity = isRunner
        ? game.corp.identity
        : game.runner.identity;
      const opponentName = isRunner ? game.corp.username : game.runner.username;
      const faction = idToFaction(shortenId(identity ?? undefined));
      const color = factionToColor(faction);
      const userRole = isRunner ? "runner" : "corp";
      const isWin = game.winner === userRole;

      return {
        id: index,
        color,
        isWin,
        identity: shortenId(identity ?? undefined),
        opponentIdentity: shortenId(opponentIdentity ?? undefined),
        opponentName: opponentName ?? "Unknown",
        completedAt: game.completedAt,
        faction,
      };
    });
  }, [games, username]);

  // Dots sorted by faction
  const factionSortedDots = useMemo(() => {
    return [...dots].sort((a, b) => {
      const aIndex = FACTION_NAMES.indexOf(a.faction);
      const bIndex = FACTION_NAMES.indexOf(b.faction);
      return aIndex - bIndex;
    });
  }, [dots]);

  // Calculate initial (chronological) positions
  const initialPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    dots.forEach((dot, index) => {
      const row = Math.floor(index / DOTS_PER_ROW);
      const col = index % DOTS_PER_ROW;
      positions[dot.id] = {
        x: col * (DOT_SIZE + DOT_GAP),
        y: row * (DOT_SIZE + DOT_GAP),
      };
    });
    return positions;
  }, [dots, DOTS_PER_ROW, DOT_SIZE, DOT_GAP]);

  // Calculate sorted (by faction) positions
  const sortedPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    factionSortedDots.forEach((dot, index) => {
      const row = Math.floor(index / DOTS_PER_ROW);
      const col = index % DOTS_PER_ROW;
      positions[dot.id] = {
        x: col * (DOT_SIZE + DOT_GAP),
        y: row * (DOT_SIZE + DOT_GAP),
      };
    });
    return positions;
  }, [factionSortedDots, DOTS_PER_ROW, DOT_SIZE, DOT_GAP]);

  // Native scroll listener for tracking progress
  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;
    if (!scrollContainer || !containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      // Calculate progress based on container position within scroll container
      const containerRect = container.getBoundingClientRect();
      const scrollContainerRect = scrollContainer.getBoundingClientRect();

      // How far container top is from scroll container top (negative when scrolled past)
      const containerTop = containerRect.top - scrollContainerRect.top;
      // Total scrollable distance for this container (container height - viewport height)
      const scrollableDistance = container.offsetHeight - scrollContainer.clientHeight;

      // Progress: 0 when container top at viewport top, 1 when container bottom at viewport bottom
      const progress = Math.max(0, Math.min(1, -containerTop / scrollableDistance));

      // Update all dot positions directly via refs (no React re-render)
      dotElementsRef.current.forEach((el, id) => {
        const initial = initialPositions[id];
        const sorted = sortedPositions[id];
        if (!initial || !sorted) return;

        const x = lerp(initial.x, sorted.x, progress);
        const y = lerp(initial.y, sorted.y, progress);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    // Initial call
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [scrollContainerRef, initialPositions, sortedPositions]);

  const totalRows = Math.ceil(dots.length / DOTS_PER_ROW);
  const gridHeight = totalRows * DOT_SIZE + (totalRows - 1) * DOT_GAP;

  return (
    <div
      ref={containerRef}
      style={{
        height: "200vh",
        position: "relative",
        background: "linear-gradient(145deg, #0a0a0a, #1a1a2e)",
      }}
    >
      {/* First snap point */}
      <div
        style={{
          position: "absolute",
          top: 0,
          height: "1px",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
        }}
      />
      {/* Second snap point */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          height: "1px",
          scrollSnapAlign: "end",
        }}
      />
      {/* Sticky container */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <Title order={2} ta="center" c="gray.2">
          Here&apos;s all of those games:
        </Title>
        <Box
          style={{
            position: "relative",
            width: FULL_ROW_WIDTH,
            height: gridHeight,
          }}
        >
          {dots.map((dot) => {
            const initial = initialPositions[dot.id];
            return (
              <Dot
                key={dot.id}
                dot={dot}
                dotSize={DOT_SIZE}
                initialX={initial.x}
                initialY={initial.y}
                onRef={handleDotRef}
              />
            );
          })}
        </Box>
      </div>
    </div>
  );
}
