import { TournamentRow } from "@/lib/localtypes";
import { START_DATE_FILTER_KEY, END_DATE_FILTER_KEY } from "@/lib/util";
import { Title, RangeSlider, Stack } from "@mantine/core";
import { format, parse } from "date-fns";
import { useMemo, useEffect, useState } from "react";
import { BarChart } from "@mantine/charts";
import { useSearchParams } from "next/navigation";

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

export default function DateFilter({
  tournaments,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: {
  tournaments: TournamentRow[];
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}) {
  const searchParams = useSearchParams();

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

  useEffect(() => {
    if (!searchParams.has(START_DATE_FILTER_KEY)) {
      setSelectedStartIndex(0);
    }
    if (
      !searchParams.has(END_DATE_FILTER_KEY) ||
      selectedEndIndex >= uniqueDates.length
    ) {
      setSelectedEndIndex(uniqueDates.length - 1);
    }
  }, [uniqueDates]);

  const [initialStartIndex, initialEndIndex] = [
    uniqueDates.indexOf(startDate),
    uniqueDates.indexOf(endDate),
  ];

  const [selectedStartIndex, setSelectedStartIndex] = useState(
    initialStartIndex === -1 ? 0 : initialStartIndex
  );
  const [selectedEndIndex, setSelectedEndIndex] = useState(
    initialEndIndex === -1 ? 0 : initialEndIndex
  );

  useEffect(() => {
    setStartDate(
      selectedStartIndex === 0 ? "" : uniqueDates[selectedStartIndex]
    );
    setEndDate(
      selectedEndIndex === uniqueDates.length - 1
        ? ""
        : uniqueDates[selectedEndIndex]
    );
  }, [selectedStartIndex, selectedEndIndex]);

  const data = useMemo(
    () =>
      uniqueDates.map((date, i) => {
        const tournaments = groupedByDate[date] ?? [];
        const inRange = isInRange(date, uniqueDates, [
          selectedStartIndex,
          selectedEndIndex,
        ]);

        return {
          tournaments,
          selectedCount: inRange ? tournaments.length : 0,
          unselectedCount: inRange ? 0 : tournaments.length,
          selected: i >= selectedStartIndex && i <= selectedEndIndex,

          date,
        };
      }),
    [
      tournaments,
      uniqueDates,
      groupedByDate,
      uniqueDates,
      selectedStartIndex,
      selectedEndIndex,
    ]
  );

  const filteredDates = data.map(({ date }) => date);

  return (
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
        value={[selectedStartIndex, selectedEndIndex]}
        onChange={([start, end]) => {
          setSelectedStartIndex(start);
          setSelectedEndIndex(end);
        }}
        label={(value) => {
          if (value > filteredDates.length - 1) {
            return "";
          }
          return format(
            parse(filteredDates[value], "yyyy-MM-dd", new Date()),
            "d MMMM yyyy"
          );
        }}
      />
    </Stack>
  );
}
