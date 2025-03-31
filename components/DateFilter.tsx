import { TournamentRow } from "@/lib/localtypes";
import { START_DATE_FILTER_KEY, END_DATE_FILTER_KEY } from "@/lib/util";
import { Title, RangeSlider } from "@mantine/core";
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

  const dateRange = useMemo(
    () =>
      getRangeOfDates(
        tournaments.reduce((acc, tournament) => {
          const date = tournament.date ?? "unknown";
          return date < acc ? date : acc;
        }, tournaments[0].date ?? "2023-01-01"),
        tournaments.reduce((acc, tournament) => {
          const date = tournament.date ?? "unknown";
          return date > acc ? date : acc;
        }, tournaments[0].date ?? "2023-01-01")
      ),
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

  useEffect(() => {
    if (
      !searchParams.has(START_DATE_FILTER_KEY) &&
      !searchParams.has(END_DATE_FILTER_KEY)
    ) {
      setSelectedDateRange([0, uniqueDates.length - 1]);
    }
  }, [uniqueDates]);

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

  useEffect(() => {
    setStartDate(uniqueDates[selectedDateRange[0]]);
    setEndDate(uniqueDates[selectedDateRange[1]]);
  }, [selectedDateRange]);

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

  const filteredDates = data.map(({ date }) => date);

  return (
    <>
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
    </>
  );
}
