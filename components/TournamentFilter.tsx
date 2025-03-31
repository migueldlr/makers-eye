"use client";

import { TournamentRow } from "@/lib/localtypes";
import { END_DATE_FILTER_KEY, START_DATE_FILTER_KEY } from "@/lib/util";
import { BarChart } from "@mantine/charts";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  ActionIcon,
  Box,
  Button,
  Group,
  Pill,
  RangeSlider,
  Stack,
  Title,
} from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { format, parse } from "date-fns";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

const WIDTH = 300;

export default function TournamentFilter({
  tournaments,
}: {
  tournaments: TournamentRow[];
}) {
  const [collapsed, setCollapsed] = useState(false);
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

  const initialStartDate = searchParams.get(START_DATE_FILTER_KEY) ?? "";
  const initialEndDate = searchParams.get(END_DATE_FILTER_KEY) ?? "";

  const [initialStartIndex, initialEndIndex] = [
    uniqueDates.indexOf(initialStartDate),
    uniqueDates.indexOf(initialEndDate),
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
    if (
      !searchParams.has(START_DATE_FILTER_KEY) &&
      !searchParams.has(END_DATE_FILTER_KEY)
    ) {
      setSelectedDateRange([0, uniqueDates.length - 1]);
    }
  }, [uniqueDates]);

  const selectedTournaments = tournaments.filter((tournament) => {
    const date = tournament.date ?? "unknown";
    return isInRange(date, uniqueDates, selectedDateRange);
  });
  const filteredDates = data.map(({ date }) => date);

  const startDateSelected = uniqueDates[selectedDateRange[0]];
  const endDateSelected = uniqueDates[selectedDateRange[1]];

  useEffect(() => {}, [selectedDateRange]);

  const ids = selectedTournaments.map((tournament) => tournament.id);
  ids.sort();

  const href = `${pathname}?${START_DATE_FILTER_KEY}=${startDateSelected}&${END_DATE_FILTER_KEY}=${endDateSelected}`;

  const hasFilters =
    searchParams.has(START_DATE_FILTER_KEY) ||
    searchParams.has(END_DATE_FILTER_KEY);

  const startDateParam = searchParams.get(START_DATE_FILTER_KEY);
  const endDateParam = searchParams.get(END_DATE_FILTER_KEY);

  const primaryContent = (
    <>
      <Stack gap="xs">
        <Title order={4}>Date</Title>
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
      <Group mt="lg">
        {hasFilters && (
          <Button
            component={Link}
            href={pathname}
            variant="outline"
            scroll={false}
          >
            Reset
          </Button>
        )}
        <Button component={Link} href={href} scroll={false}>
          Filter
        </Button>
      </Group>
      {/* <ActionIcon
        variant="transparent"
        mt="md"
        onClick={() => setCollapsed(true)}
      >
        <IconChevronUp style={{ width: "70%", height: "70%" }} />
      </ActionIcon> */}
    </>
  );

  const collapsedContent = (
    <Box>
      <ActionIcon
        variant="transparent"
        mt="md"
        onClick={() => setCollapsed(false)}
      >
        <IconChevronDown style={{ width: "70%", height: "70%" }} />
      </ActionIcon>
    </Box>
  );

  const startDateTag = startDateParam ? (
    <Pill>Start date: {startDateParam}</Pill>
  ) : null;
  const endDateTag = endDateParam ? (
    <Pill>End date: {endDateParam}</Pill>
  ) : null;

  return (
    <Accordion
      defaultValue="filters"
      variant="filled"
      pos="sticky"
      top={0}
      style={{ zIndex: 100 }}
    >
      <AccordionItem value="filters">
        <AccordionControl bg="dark.6">
          <Group>
            <Title order={3}>Filters</Title>
            {hasFilters && (
              <Group>
                {startDateTag}
                {endDateTag}
              </Group>
            )}
          </Group>
        </AccordionControl>
        <AccordionPanel>{primaryContent}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
