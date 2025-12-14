"use client";

import { useState, useMemo } from "react";
import { Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { format } from "date-fns";
import type { GameRecord } from "@/lib/wrapped/types";
import {
  findLongestStreak,
  findLongestDrought,
  findBusiestDay,
  findBusiestWeek,
  findBusiestMonth,
} from "@/lib/wrapped/processing";
import Slide from "./Slide";
import ActivityCalendar, { type HighlightRange } from "./ActivityCalendar";

interface StreaksSlideProps {
  games: GameRecord[];
  username: string;
}

interface StatCardProps {
  label: string;
  value: string | null;
  subtitle: string | null;
  emptyMessage: string;
  highlightRange: HighlightRange | null;
  onHighlight: (range: HighlightRange | null) => void;
  isAnyHovered: boolean;
  isThisHovered: boolean;
}

function StatCard({
  label,
  value,
  subtitle,
  emptyMessage,
  highlightRange,
  onHighlight,
  isAnyHovered,
  isThisHovered,
}: StatCardProps) {
  return (
    <Paper
      p="md"
      radius={16}
      style={{
        background: "rgba(0, 0, 0, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(8px)",
        cursor: value ? "pointer" : "default",
        opacity: isAnyHovered && !isThisHovered ? 0.4 : 1,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={() => highlightRange && onHighlight(highlightRange)}
      onMouseLeave={() => onHighlight(null)}
    >
      <Stack gap={6} align="center">
        <Text fw={600} c="gray.5">
          {label}
        </Text>
        {value ? (
          <>
            <Title order={2} c="white">
              {value}
            </Title>
            {subtitle && (
              <Text size="sm" c="gray.6" ta="center">
                {subtitle}
              </Text>
            )}
          </>
        ) : (
          <Text size="sm" c="gray.6">
            {emptyMessage}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function formatRange(start: Date, end: Date): string {
  const startStr = format(start, "MMM d");
  const endStr = format(end, "MMM d");
  if (startStr === endStr) return startStr;
  return `${startStr} – ${endStr}`;
}

function formatDate(date: Date): string {
  return format(date, "MMM d");
}

function pluralize(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : singular + "s"}`;
}

export default function StreaksSlide({ games, username }: StreaksSlideProps) {
  const [calendarHighlight, setCalendarHighlight] =
    useState<HighlightRange | null>(null);

  const longestStreak = useMemo(
    () => findLongestStreak(games, username),
    [games, username]
  );
  const longestDrought = useMemo(
    () => findLongestDrought(games, username),
    [games, username]
  );
  const busiestDay = useMemo(
    () => findBusiestDay(games, username),
    [games, username]
  );
  const busiestWeek = useMemo(
    () => findBusiestWeek(games, username),
    [games, username]
  );
  const busiestMonth = useMemo(
    () => findBusiestMonth(games, username),
    [games, username]
  );

  const stats: StatCardProps[] = [
    {
      label: "Busiest day",
      value: busiestDay ? pluralize(busiestDay.games, "game") : null,
      subtitle: busiestDay ? `on ${formatDate(busiestDay.date)}` : null,
      emptyMessage: "No dated games available.",
      highlightRange: busiestDay
        ? { start: busiestDay.date, end: busiestDay.date }
        : null,
      onHighlight: setCalendarHighlight,
    },
    {
      label: "Busiest week",
      value: busiestWeek ? pluralize(busiestWeek.games, "game") : null,
      subtitle: busiestWeek
        ? formatRange(busiestWeek.weekStart, busiestWeek.weekEnd)
        : null,
      emptyMessage: "No dated games available.",
      highlightRange: busiestWeek
        ? { start: busiestWeek.weekStart, end: busiestWeek.weekEnd }
        : null,
      onHighlight: setCalendarHighlight,
    },
    {
      label: "Busiest month",
      value: busiestMonth ? pluralize(busiestMonth.games, "game") : null,
      subtitle: busiestMonth ? format(busiestMonth.monthStart, "MMMM") : null,
      emptyMessage: "No dated games available.",
      highlightRange: busiestMonth
        ? { start: busiestMonth.monthStart, end: busiestMonth.monthEnd }
        : null,
      onHighlight: setCalendarHighlight,
    },
    {
      label: "Longest streak",
      value: longestStreak ? pluralize(longestStreak.days, "day") : null,
      subtitle: longestStreak
        ? formatRange(longestStreak.start, longestStreak.end)
        : null,
      emptyMessage: "Not enough games yet.",
      highlightRange: longestStreak
        ? { start: longestStreak.start, end: longestStreak.end }
        : null,
      onHighlight: setCalendarHighlight,
    },
    {
      label: "Longest drought",
      value: longestDrought ? pluralize(longestDrought.days, "day") : null,
      subtitle: longestDrought
        ? formatRange(longestDrought.start, longestDrought.end)
        : null,
      emptyMessage: "No breaks detected yet.",
      highlightRange: longestDrought
        ? { start: longestDrought.start, end: longestDrought.end }
        : null,
      onHighlight: setCalendarHighlight,
    },
  ];

  return (
    <Slide gradient="linear-gradient(145deg, #1a3a2e, #0d4a3e)">
      <Stack gap="lg" align="center">
        <Title order={2} ta="center">
          Are you a grinder? You tell me.
        </Title>
        <ActivityCalendar
          games={games}
          username={username}
          highlightRange={calendarHighlight}
        />
        <SimpleGrid
          cols={{ base: 1, sm: 3 }}
          style={{ width: "100%", maxWidth: 800 }}
        >
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              {...stat}
              isAnyHovered={calendarHighlight !== null}
              isThisHovered={
                calendarHighlight !== null &&
                stat.highlightRange !== null &&
                calendarHighlight.start.getTime() ===
                  stat.highlightRange.start.getTime() &&
                calendarHighlight.end.getTime() ===
                  stat.highlightRange.end.getTime()
              }
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Slide>
  );
}
