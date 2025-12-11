"use client";

import { Paper, Stack, Text } from "@mantine/core";
import { motion } from "framer-motion";
import { useState, useRef, useLayoutEffect, type ReactNode } from "react";
import type { GameHighlight } from "@/lib/wrapped/types";
import { shortenId } from "@/lib/util";

export type HighlightDescriptor = {
  title: string;
  highlight: GameHighlight | null;
  formatValue: (value: number) => string;
  emptyMessage: string;
  renderDetails?: (highlight: GameHighlight) => ReactNode;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function describeOpponentLine(highlight: GameHighlight) {
  const myId = shortenId(highlight.identity ?? undefined);
  const opponentId = shortenId(highlight.opponentIdentity ?? undefined);
  const opponentName = highlight.opponent ?? "Unknown";
  return `${myId} vs ${opponentId} (${opponentName})`;
}

function BentoHighlightCard({
  title,
  highlight,
  formatValue,
  emptyMessage,
  renderDetails,
  expanded,
  onToggle,
}: HighlightDescriptor & {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      style={{
        cursor: highlight ? "pointer" : "default",
        height: "100%",
      }}
      onClick={() => highlight && onToggle()}
    >
      <Paper
        withBorder
        radius="md"
        p="sm"
        component={motion.div}
        layout
        style={{
          background: "rgba(7, 6, 19, 0.75)",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <motion.div layout="position">
          <Stack gap={4}>
            {/* Title - always visible */}
            <Text
              size="xs"
              c="gray.5"
              fw={500}
              tt="uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              {title}
            </Text>
            {/* Value - always visible */}
            {highlight ? (
              <Text
                fw={700}
                c="gray.0"
                style={{
                  fontSize: "1.25rem",
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatValue(highlight.value)}
              </Text>
            ) : (
              <Text size="sm" c="gray.5">
                {emptyMessage}
              </Text>
            )}

            {/* Details - only when expanded */}
            {expanded && highlight && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.1 }}
              >
                <Stack gap={4}>
                  {!renderDetails && (
                    <>
                      <Text size="xs" c="gray.5">
                        {describeOpponentLine(highlight)}
                      </Text>
                      {highlight.completedAt && (
                        <Text size="xs" c="gray.6">
                          {formatDate(highlight.completedAt)}
                        </Text>
                      )}
                    </>
                  )}
                  {renderDetails && renderDetails(highlight)}
                </Stack>
              </motion.div>
            )}
          </Stack>
        </motion.div>
      </Paper>
    </motion.div>
  );
}

const COLS = 4;

// Height added when a card expands (approximate)
const EXPANSION_HEIGHT = 40;

export default function BentoGrid({ items }: { items: HighlightDescriptor[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [baseRowHeights, setBaseRowHeights] = useState<number[]>([]);

  // Split items into rows
  const rows: HighlightDescriptor[][] = [];
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS));
  }

  // Measure base row heights on initial render
  useLayoutEffect(() => {
    if (baseRowHeights.length === 0 && rowRefs.current.length > 0) {
      const heights = rowRefs.current.map((ref) => ref?.offsetHeight ?? 0);
      if (heights.some((h) => h > 0)) {
        setBaseRowHeights(heights);
      }
    }
  }, [baseRowHeights.length]);

  // Calculate which row has the expanded card
  const expandedRowIndex =
    expandedIndex !== null ? Math.floor(expandedIndex / COLS) : null;

  // Calculate row heights
  const getRowHeight = (rowIndex: number): number | undefined => {
    if (baseRowHeights.length === 0) return undefined;

    const baseHeight = baseRowHeights[rowIndex] ?? 0;

    if (expandedRowIndex === null) {
      // Nothing expanded - use base height
      return baseHeight;
    }

    if (rowIndex === expandedRowIndex) {
      // Expanded row grows
      return baseHeight + EXPANSION_HEIGHT;
    } else {
      // Other rows shrink proportionally
      const otherRowCount = rows.length - 1;
      const shrinkAmount = EXPANSION_HEIGHT / otherRowCount;
      return Math.max(0, baseHeight - shrinkAmount);
    }
  };

  return (
    <motion.div
      layoutRoot
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {rows.map((rowItems, rowIndex) => {
        const rowHeight = getRowHeight(rowIndex);
        return (
          <motion.div
            key={rowIndex}
            ref={(el) => {
              rowRefs.current[rowIndex] = el;
            }}
            layout
            animate={{ height: rowHeight }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${rowItems.length}, 1fr)`,
              gap: "0.5rem",
              alignItems: "start",
              overflow: "hidden",
            }}
          >
            {rowItems.map((item, i) => {
              const globalIndex = rowIndex * COLS + i;
              const isExpanded = globalIndex === expandedIndex;
              return (
                <BentoHighlightCard
                  key={item.title}
                  {...item}
                  expanded={isExpanded}
                  onToggle={() =>
                    setExpandedIndex(expandedIndex === globalIndex ? null : globalIndex)
                  }
                />
              );
            })}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
