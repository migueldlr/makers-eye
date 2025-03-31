"use client";

import { TournamentRow } from "@/lib/localtypes";
import { END_DATE_FILTER_KEY, START_DATE_FILTER_KEY } from "@/lib/util";
import { BarChart } from "@mantine/charts";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Button,
  Group,
  Pill,
  RangeSlider,
  Stack,
  Title,
} from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DateFilter from "./DateFilter";

export default function TournamentFilter({
  tournaments,
}: {
  tournaments: TournamentRow[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [accordionValue, setAccordionValue] = useState<string | null>(
    "filters"
  );
  const toggleAccordion = () =>
    setAccordionValue(accordionValue == null ? "filters" : null);
  useHotkeys([["alt+F", toggleAccordion]]);

  const [startDateSelected, setStartDateSelected] = useState(
    searchParams.get(START_DATE_FILTER_KEY) ?? ""
  );
  const [endDateSelected, setEndDateSelected] = useState(
    searchParams.get(END_DATE_FILTER_KEY) ?? ""
  );

  const hasFilters =
    searchParams.has(START_DATE_FILTER_KEY) ||
    searchParams.has(END_DATE_FILTER_KEY);

  const startDateParam = searchParams.get(START_DATE_FILTER_KEY);
  const endDateParam = searchParams.get(END_DATE_FILTER_KEY);

  const href = useMemo(
    () =>
      pathname +
      "?" +
      new URLSearchParams({
        [START_DATE_FILTER_KEY]: startDateSelected,
        [END_DATE_FILTER_KEY]: endDateSelected,
      }).toString(),
    [startDateSelected, endDateSelected]
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
      value={accordionValue}
      onChange={setAccordionValue}
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
        <AccordionPanel>
          <Stack gap="xs">
            <DateFilter
              tournaments={tournaments}
              startDate={startDateSelected}
              setStartDate={setStartDateSelected}
              endDate={endDateSelected}
              setEndDate={setEndDateSelected}
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
                Clear filters
              </Button>
            )}
            <Button component={Link} href={href} scroll={false}>
              Filter
            </Button>
          </Group>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
