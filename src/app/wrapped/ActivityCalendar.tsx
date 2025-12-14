"use client";

import { Tooltip, Text, Stack, Box } from "@mantine/core";
import { useMemo, memo } from "react";
import { isWithinInterval, startOfDay, format } from "date-fns";
import type { GameRecord } from "@/lib/wrapped/types";
import { resolveUserRole } from "@/lib/wrapped/processing";

// Format date as local YYYY-MM-DD key (avoids UTC timezone issues)
function toLocalDateKey(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

export interface HighlightRange {
  start: Date;
  end: Date;
}

interface ActivityCalendarProps {
  games: GameRecord[];
  username: string;
  highlightRange?: HighlightRange | null;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Get color based on activity level (white gradient for green background)
function getActivityColor(count: number, maxCount: number): string {
  if (count === 0) return "rgba(255, 255, 255, 0.1)";
  const intensity = Math.min(count / Math.max(maxCount * 0.5, 1), 1);
  if (intensity < 0.25) return "rgba(255, 255, 255, 0.25)";
  if (intensity < 0.5) return "rgba(255, 255, 255, 0.45)";
  if (intensity < 0.75) return "rgba(255, 255, 255, 0.7)";
  return "rgba(255, 255, 255, 0.95)";
}

interface DayCell {
  date: Date;
  count: number;
  key: string;
  dayOfWeek: number; // 0-6, for positioning spacers
}

interface WeekColumn {
  days: DayCell[];
  leadingSpacers: number; // Empty boxes at start of column
  trailingSpacers: number; // Empty boxes at end of column
  isMonthStart: boolean; // Add gap before this column
}

const cellSize = 10;
const cellGap = 2;
const monthGap = 6;

// Memoized day cell component to prevent tooltip re-renders
const DayCellWithTooltip = memo(function DayCellWithTooltip({
  day,
  maxCount,
}: {
  day: DayCell;
  maxCount: number;
}) {
  return (
    <Tooltip
      label={
        <Stack gap={0}>
          <Text size="xs" fw={600}>
            {day.count} {day.count === 1 ? "game" : "games"}
          </Text>
          <Text size="xs" c="dimmed">
            {day.date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </Stack>
      }
      withArrow
      position="top"
    >
      <div
        style={{
          width: cellSize,
          height: cellSize,
          borderRadius: 2,
          backgroundColor: getActivityColor(day.count, maxCount),
          cursor: "pointer",
        }}
      />
    </Tooltip>
  );
});

// Memoized base calendar grid - doesn't depend on highlightRange
const CalendarGrid = memo(function CalendarGrid({
  columns,
  yearStart,
  yearEnd,
  maxCount,
}: {
  columns: WeekColumn[];
  yearStart: Date;
  yearEnd: Date;
  maxCount: number;
}) {
  return (
    <>
      {columns.map((col, colIndex) => (
        <div
          key={colIndex}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: cellGap,
            marginLeft: col.isMonthStart ? monthGap : 0,
          }}
        >
          {/* Leading spacers */}
          {Array.from({ length: col.leadingSpacers }).map((_, i) => (
            <div
              key={`spacer-lead-${i}`}
              style={{
                width: cellSize,
                height: cellSize,
              }}
            />
          ))}

          {/* Actual days */}
          {col.days.map((day) => {
            const isInRange = day.date >= yearStart && day.date <= yearEnd;

            if (!isInRange) {
              return (
                <div
                  key={day.key}
                  style={{
                    width: cellSize,
                    height: cellSize,
                  }}
                />
              );
            }

            return (
              <DayCellWithTooltip key={day.key} day={day} maxCount={maxCount} />
            );
          })}

          {/* Trailing spacers */}
          {Array.from({ length: col.trailingSpacers }).map((_, i) => (
            <div
              key={`spacer-trail-${i}`}
              style={{
                width: cellSize,
                height: cellSize,
              }}
            />
          ))}
        </div>
      ))}
    </>
  );
});

export default function ActivityCalendar({
  games,
  username,
  highlightRange,
}: ActivityCalendarProps) {
  // Build daily counts map
  const { dailyCounts, yearStart, yearEnd, maxCount } = useMemo(() => {
    const counts = new Map<string, number>();
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const game of games) {
      if (!game.completedAt) continue;
      if (!resolveUserRole(game, username)) continue;

      const date = new Date(game.completedAt);
      const key = toLocalDateKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);

      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
    }

    // Default to current year if no dates
    const now = new Date();
    const start = minDate ?? new Date(now.getFullYear(), 0, 1);
    const end = maxDate ?? new Date(now.getFullYear(), 11, 31);

    // Find max count for color scaling
    let max = 0;
    counts.forEach((count) => {
      if (count > max) max = count;
    });

    return {
      dailyCounts: counts,
      yearStart: start,
      yearEnd: end,
      maxCount: max,
    };
  }, [games, username]);

  // Generate columns - split weeks at month boundaries
  const { columns, monthLabels } = useMemo(() => {
    const cols: WeekColumn[] = [];
    const months: { label: string; colIndex: number }[] = [];

    // Start from the beginning of the week containing yearStart
    const startDate = new Date(yearStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End at the end of the week containing yearEnd
    const endDate = new Date(yearEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    let currentDate = new Date(startDate);
    let currentColumn: DayCell[] = [];
    let currentColumnStartDay = 0; // Day of week the current column starts
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const key = toLocalDateKey(currentDate);
      const count = dailyCounts.get(key) ?? 0;
      const month = currentDate.getMonth();
      const dayOfWeek = currentDate.getDay();

      // Check if we're starting a new month (and not at the start of a week)
      // Only add month labels for dates within the actual data range
      const isInDataRange = currentDate >= yearStart;

      if (month !== lastMonth && lastMonth !== -1 && dayOfWeek !== 0) {
        // End the current column with the old month's days
        if (currentColumn.length > 0) {
          cols.push({
            days: currentColumn,
            leadingSpacers: currentColumnStartDay,
            trailingSpacers: 7 - currentColumnStartDay - currentColumn.length,
            isMonthStart: false,
          });
        }
        // Start a new column for the new month
        currentColumn = [];
        currentColumnStartDay = dayOfWeek;
        // Add month label at this new column (only if in data range)
        if (isInDataRange) {
          months.push({ label: MONTH_LABELS[month], colIndex: cols.length });
        }
      } else if (month !== lastMonth && dayOfWeek === 0 && isInDataRange) {
        // Month starts on Sunday - add label at current position (only if in data range)
        months.push({ label: MONTH_LABELS[month], colIndex: cols.length });
      }

      lastMonth = month;

      currentColumn.push({
        date: new Date(currentDate),
        count,
        key,
        dayOfWeek,
      });

      // When we complete a week (Saturday), push the column
      if (dayOfWeek === 6) {
        cols.push({
          days: currentColumn,
          leadingSpacers: currentColumnStartDay,
          trailingSpacers: 0,
          isMonthStart:
            cols.length > 0 && months.some((m) => m.colIndex === cols.length),
        });
        currentColumn = [];
        currentColumnStartDay = 0;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push any remaining days
    if (currentColumn.length > 0) {
      cols.push({
        days: currentColumn,
        leadingSpacers: currentColumnStartDay,
        trailingSpacers: 7 - currentColumnStartDay - currentColumn.length,
        isMonthStart: false,
      });
    }

    // Mark columns that start a new month (for gap)
    cols.forEach((col, i) => {
      if (i > 0 && months.some((m) => m.colIndex === i)) {
        col.isMonthStart = true;
      }
    });

    return { columns: cols, monthLabels: months };
  }, [yearStart, yearEnd, dailyCounts]);

  // Calculate column offset accounting for month gaps
  const getColOffset = (colIndex: number) => {
    let offset = colIndex * (cellSize + cellGap);
    for (let i = 0; i < colIndex; i++) {
      if (columns[i + 1]?.isMonthStart) {
        offset += monthGap;
      }
    }
    return offset;
  };

  // Precompute column x-offsets to match the grid layout exactly
  const columnOffsets = useMemo(() => {
    const offsets: number[] = [];
    let currentOffset = 0;

    columns.forEach((col) => {
      // Add month gap margin if this column has isMonthStart
      if (col.isMonthStart) {
        currentOffset += monthGap;
      }
      offsets.push(currentOffset);
      // After this column, add cell width + gap for the next column
      currentOffset += cellSize + cellGap;
    });

    return offsets;
  }, [columns]);

  // Compute highlighted cells for overlay (only when highlighting)
  const highlightedCells = useMemo(() => {
    if (!highlightRange) return [];

    const cells: {
      day: DayCell;
      colIndex: number;
      rowIndex: number;
      colOffset: number;
    }[] = [];

    columns.forEach((col, colIndex) => {
      col.days.forEach((day, dayIndex) => {
        const isInRange = day.date >= yearStart && day.date <= yearEnd;
        if (!isInRange) return;

        const isHighlighted = isWithinInterval(startOfDay(day.date), {
          start: startOfDay(highlightRange.start),
          end: startOfDay(highlightRange.end),
        });

        if (isHighlighted) {
          // Calculate position: row = leadingSpacers + dayIndex
          const rowIndex = col.leadingSpacers + dayIndex;
          const colOffset = columnOffsets[colIndex];

          cells.push({ day, colIndex, rowIndex, colOffset });
        }
      });
    });

    return cells;
  }, [highlightRange, columns, yearStart, yearEnd, columnOffsets]);

  return (
    <Box style={{ overflowX: "auto", maxWidth: "100%" }}>
      <div style={{ display: "inline-block" }}>
        {/* Month labels */}
        <div
          style={{
            display: "flex",
            marginBottom: 4,
            height: 14,
            position: "relative",
          }}
        >
          {monthLabels.map(({ label, colIndex }, i) => (
            <Text
              key={`${label}-${i}`}
              size="xs"
              c="dimmed"
              style={{
                position: "absolute",
                left: getColOffset(colIndex),
                fontSize: 10,
              }}
            >
              {label}
            </Text>
          ))}
        </div>

        <div style={{ display: "flex", position: "relative" }}>
          {/* Calendar grid - fades when highlighting */}
          <div
            style={{
              display: "flex",
              gap: cellGap,
              opacity: highlightRange ? 0.15 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            <CalendarGrid
              columns={columns}
              yearStart={yearStart}
              yearEnd={yearEnd}
              maxCount={maxCount}
            />
          </div>

          {/* Highlight overlay - renders highlighted cells on top (no tooltips, just visual) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              opacity: highlightRange && highlightedCells.length > 0 ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            {highlightedCells.map(({ day, rowIndex, colOffset }) => (
              <div
                key={`highlight-${day.key}`}
                style={{
                  position: "absolute",
                  left: colOffset,
                  top: rowIndex * (cellSize + cellGap),
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 2,
                  backgroundColor: getActivityColor(day.count, maxCount),
                  boxShadow: "0 0 2px 2px rgba(255, 255, 255, 0.1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Box>
  );
}
