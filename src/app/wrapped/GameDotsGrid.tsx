"use client";

import { Box, Title, Tooltip } from "@mantine/core";
import { memo, useRef, useEffect, useCallback } from "react";
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
        }}
      />
    </Tooltip>
  );
}

export default memo(function GameDotsGrid({
  games,
  username,
  scrollContainerRef,
}: GameDotsGridProps) {
  const DOT_SIZE = 8;
  const DOT_GAP = 3;
  const MAX_WIDTH = 600;
  const DOTS_PER_ROW = Math.floor((MAX_WIDTH + DOT_GAP) / (DOT_SIZE + DOT_GAP));
  const FULL_ROW_WIDTH = DOTS_PER_ROW * DOT_SIZE + (DOTS_PER_ROW - 1) * DOT_GAP;

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lastPhaseRef = useRef<number>(0);

  // Store dot elements for direct DOM manipulation
  const dotElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Title text for each phase
  const TITLES = [
    "Here's all of those games.",
    "Sorted by faction:",
    "Or grouped by identity:",
  ];

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

  // Dots sorted by faction, then by identity within faction
  const identitySortedDots = useMemo(() => {
    return [...dots].sort((a, b) => {
      // First sort by faction
      const aFactionIndex = FACTION_NAMES.indexOf(a.faction);
      const bFactionIndex = FACTION_NAMES.indexOf(b.faction);
      if (aFactionIndex !== bFactionIndex) {
        return aFactionIndex - bFactionIndex;
      }
      // Then sort by identity name within faction
      return a.identity.localeCompare(b.identity);
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
  const factionPositions = useMemo(() => {
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

  // Calculate identity cluster positions - each identity gets a centroid in a grid, dots cluster around it
  const CLUSTER_WIDTH = 800;
  const CLUSTER_HEIGHT = 500;
  const CLUSTER_RADIUS = 30;

  const identityPositions = useMemo(() => {
    // Group dots by identity
    const identityGroups = new Map<string, GameDot[]>();
    identitySortedDots.forEach((dot) => {
      const group = identityGroups.get(dot.identity) || [];
      group.push(dot);
      identityGroups.set(dot.identity, group);
    });

    const identities = Array.from(identityGroups.keys());
    const numIdentities = identities.length;

    // Calculate centroids in a grid pattern
    const cols = Math.ceil(Math.sqrt(numIdentities));
    const rows = Math.ceil(numIdentities / cols);
    const cellWidth = CLUSTER_WIDTH / cols;
    const cellHeight = CLUSTER_HEIGHT / rows;

    // Create a seeded random function for consistent positions
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };

    const positions: { x: number; y: number }[] = [];
    const offsetX = (CLUSTER_WIDTH - FULL_ROW_WIDTH) / 2;

    identities.forEach((identity, identityIndex) => {
      const col = identityIndex % cols;
      const row = Math.floor(identityIndex / cols);

      // Centroid position (center of the cell)
      const centroidX = col * cellWidth + cellWidth / 2;
      const centroidY = row * cellHeight + cellHeight / 2;

      const dotsInGroup = identityGroups.get(identity) || [];

      dotsInGroup.forEach((dot, dotIndex) => {
        // Use dot.id as seed for consistent random offset
        const seed = dot.id * 1000 + dotIndex;
        const angle = seededRandom(seed) * Math.PI * 2;
        const distance =
          seededRandom(seed + 1) *
          CLUSTER_RADIUS *
          Math.sqrt(seededRandom(seed + 2));

        positions[dot.id] = {
          x: centroidX + Math.cos(angle) * distance - offsetX,
          y: centroidY + Math.sin(angle) * distance,
        };
      });
    });

    return positions;
  }, [identitySortedDots, FULL_ROW_WIDTH]);

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

      // Early exit if container is not in view (skip expensive calculations)
      if (
        containerRect.bottom < scrollContainerRect.top ||
        containerRect.top > scrollContainerRect.bottom
      ) {
        return;
      }

      // How far container top is from scroll container top (negative when scrolled past)
      const containerTop = containerRect.top - scrollContainerRect.top;
      // Total scrollable distance for this container (container height - viewport height)
      const scrollableDistance =
        container.offsetHeight - scrollContainer.clientHeight;

      // Progress: 0 when container top at viewport top, 1 when container bottom at viewport bottom
      const progress = Math.max(
        0,
        Math.min(1, -containerTop / scrollableDistance)
      );

      // Two-phase animation:
      // 0-0.5: chronological -> faction sorted
      // 0.5-1: faction sorted -> identity sorted
      const phase1Progress = Math.min(1, progress * 2); // 0-0.5 maps to 0-1
      const phase2Progress = Math.max(0, (progress - 0.5) * 2); // 0.5-1 maps to 0-1

      // Update all dot positions directly via refs (no React re-render)
      dotElementsRef.current.forEach((el, id) => {
        const initial = initialPositions[id];
        const faction = factionPositions[id];
        const identity = identityPositions[id];
        if (!initial || !faction || !identity) return;

        // First lerp from initial to faction, then from faction to identity
        const phase1X = lerp(initial.x, faction.x, phase1Progress);
        const phase1Y = lerp(initial.y, faction.y, phase1Progress);
        const x = lerp(phase1X, identity.x, phase2Progress);
        const y = lerp(phase1Y, identity.y, phase2Progress);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });

      // Update title via ref with slide animation (no React re-render)
      if (titleRef.current) {
        const newPhaseIndex =
          phase2Progress > 0.5 ? 2 : phase1Progress > 0.5 ? 1 : 0;

        if (lastPhaseRef.current !== newPhaseIndex) {
          const isScrollingDown = newPhaseIndex > lastPhaseRef.current;
          lastPhaseRef.current = newPhaseIndex;

          // Instantly position for slide in
          titleRef.current.style.transition = "none";
          titleRef.current.style.opacity = "0";
          titleRef.current.style.transform = isScrollingDown
            ? "translateY(20px)"
            : "translateY(-20px)";
          titleRef.current.textContent = TITLES[newPhaseIndex];

          // Force reflow
          titleRef.current.offsetHeight;

          // Slide in
          titleRef.current.style.transition =
            "opacity 0.2s ease-out, transform 0.2s ease-out";
          titleRef.current.style.opacity = "1";
          titleRef.current.style.transform = "translateY(0)";
        }
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    // Initial call
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [
    scrollContainerRef,
    initialPositions,
    factionPositions,
    identityPositions,
  ]);

  const totalRows = Math.ceil(dots.length / DOTS_PER_ROW);
  const gridHeight = totalRows * DOT_SIZE + (totalRows - 1) * DOT_GAP;

  return (
    <div
      ref={containerRef}
      style={{
        height: "300vh",
        position: "relative",
        background: "linear-gradient(145deg, #0a0a0a, #1a1a2e)",
      }}
    >
      {/* First snap point - chronological view */}
      <div
        style={{
          position: "absolute",
          top: 0,
          height: "1px",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
        }}
      />
      {/* Middle snap point - faction sorted view (at 100vh, which is 50% of scrollable distance) */}
      <div
        style={{
          position: "absolute",
          top: "100vh",
          height: "1px",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
        }}
      />
      {/* Third snap point - identity sorted view */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          height: "1px",
          scrollSnapAlign: "end",
          scrollSnapStop: "always",
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
        <Title order={2} ta="center" c="gray.2" ref={titleRef}>
          {TITLES[0]}
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
});
