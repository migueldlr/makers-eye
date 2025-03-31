"use client";

import { TournamentRow } from "@/lib/localtypes";
import { BarChart } from "@mantine/charts";
import { Box, Button, RangeSlider, Stack } from "@mantine/core";
import { format, max, min, parse } from "date-fns";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export const TOURNAMENT_FILTER_KEY = "tournamentFilter";

function getRangeOfDates(startDate: string, endDate: string) {
  const start = parse(startDate, "yyyy-MM-dd", new Date());
  const end = parse(endDate, "yyyy-MM-dd", new Date());
  const dates = [];
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(format(date, "yyyy-MM-dd"));
  }
  return dates;
}

function isInRange(
  date: string,
  uniqueDates: string[],
  range: [number, number]
) {
  const index = uniqueDates.indexOf(date);
  return index >= range[0] && index <= range[1];
}

function getMinMaxDate(dates?: string[]) {
  if (dates == null || dates.length == 0) return ["", ""];
  const minDate = format(
    min(dates.map((date) => parse(date, "yyyy-MM-dd", new Date()))),
    "yyyy-MM-dd"
  );
  const maxDate = format(
    max(dates.map((date) => parse(date, "yyyy-MM-dd", new Date()))),
    "yyyy-MM-dd"
  );
  return [minDate, maxDate];
}

const WIDTH = 300;

export default function TournamentFilter({
  tournaments,
}: {
  tournaments: TournamentRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startDate = useMemo(
    () =>
      tournaments.reduce((acc, tournament) => {
        const date = tournament.date ?? "unknown";
        return date < acc ? date : acc;
      }, tournaments[0].date ?? "2023-01-01"),
    []
  );
  const endDate = useMemo(
    () =>
      tournaments.reduce((acc, tournament) => {
        const date = tournament.date ?? "unknown";
        return date > acc ? date : acc;
      }, tournaments[0].date ?? "2023-01-01"),
    []
  );
  const dateRange = useMemo(
    () => getRangeOfDates(startDate, endDate),
    [startDate, endDate]
  );

  const groupedByDate = useMemo(
    () =>
      tournaments.reduce((acc, tournament) => {
        const key = tournament.date ?? "unknown";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(tournament);
        return acc;
      }, {} as Record<string, TournamentRow[]>),
    [tournaments]
  );
  const uniqueDates = useMemo(
    () => Object.keys(groupedByDate).sort(),
    [groupedByDate]
  );

  const initialIds =
    searchParams
      .get(TOURNAMENT_FILTER_KEY)
      ?.split(",")
      .map((x) => Number(x)) ?? [];

  const initialDates = initialIds
    .map((id) => {
      const tournament = tournaments.find((tournament) => tournament.id === id);
      return tournament?.date ?? "";
    })
    .filter((x) => x.length > 0)
    .sort();
  const minMaxDate = getMinMaxDate(initialDates);

  const [initialStartIndex, initialEndIndex] = [
    uniqueDates.indexOf(minMaxDate[0] as string),
    uniqueDates.indexOf(minMaxDate[1] as string),
  ];

  const [selectedDateRange, setSelectedDateRange] = useState<[number, number]>([
    initialStartIndex === -1 ? 0 : initialStartIndex,
    initialEndIndex === -1 ? 0 : initialEndIndex,
  ]);

  const data = useMemo(
    () =>
      dateRange
        .map((date) => {
          const tournaments = groupedByDate[date] ?? [];

          return {
            tournaments,
            selectedCount: isInRange(date, uniqueDates, selectedDateRange)
              ? tournaments.length
              : 0,
            unselectedCount: isInRange(date, uniqueDates, selectedDateRange)
              ? 0
              : tournaments.length,
            date,
          };
        })
        .filter(({ tournaments }) => tournaments.length > 0)
        .map((row, i) => {
          return {
            ...row,
            selected: i >= selectedDateRange[0] && i <= selectedDateRange[1],
          };
        }),
    [dateRange, groupedByDate, uniqueDates, selectedDateRange]
  );

  useEffect(() => {
    if (!searchParams.has(TOURNAMENT_FILTER_KEY)) {
      setSelectedDateRange([0, uniqueDates.length - 1]);
    }
  }, [uniqueDates]);

  const selectedTournaments = tournaments.filter((tournament) => {
    const date = tournament.date ?? "unknown";
    return isInRange(date, uniqueDates, selectedDateRange);
  });
  const filteredDates = data.map(({ date }) => date);

  useEffect(() => {
    // console.log(selectedTournaments.map((tournament) => tournament.name));
  }, [selectedTournaments]);

  const ids = selectedTournaments.map((tournament) => tournament.id);
  ids.sort();

  const href = `${pathname}?${TOURNAMENT_FILTER_KEY}=${ids.join(",")}`;

  return (
    <Box>
      <Stack gap="xs">
        <BarChart
          data={data}
          series={[
            { name: "selectedCount", color: "blue" },
            { name: "unselectedCount", color: "gray" },
          ]}
          type="stacked"
          dataKey="date"
          h={100}
          w={WIDTH}
          withXAxis={false}
          withYAxis={false}
          withTooltip={false}
          gridAxis="none"
        />
        <RangeSlider
          restrictToMarks
          max={filteredDates.length - 1}
          minRange={0}
          w={WIDTH}
          value={selectedDateRange}
          onChange={setSelectedDateRange}
          label={(value) =>
            format(
              parse(filteredDates[value], "yyyy-MM-dd", new Date()),
              "d MMMM yyyy"
            )
          }
        />
      </Stack>
      <Button mt="lg" component={Link} href={href}>
        Filter
      </Button>
    </Box>
  );
}
