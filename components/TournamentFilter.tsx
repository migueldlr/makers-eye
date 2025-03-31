"use client";

import { TournamentRow } from "@/lib/localtypes";
import {
  DEFAULT_NONE,
  END_DATE_FILTER_KEY,
  REGION_FILTER_KEY,
  REGION_OPTIONS,
  START_DATE_FILTER_KEY,
} from "@/lib/util";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Button,
  Group,
  Pill,
  Title,
} from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import DateFilter from "./DateFilter";
import RegionFilter from "./RegionFilter";

export const ALL_REGION_OPTIONS = [...REGION_OPTIONS, DEFAULT_NONE];

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
  const initialRegion_raw = searchParams.get("region");
  const initialRegion = (initialRegion_raw ?? "")
    .split(",")
    .filter((x) => x.length > 0);

  const [regionsSelected, setRegionsSelected] = useState<string[]>(
    initialRegion.length > 0 ? initialRegion : ALL_REGION_OPTIONS
  );

  const hasFilters =
    searchParams.has(START_DATE_FILTER_KEY) ||
    searchParams.has(END_DATE_FILTER_KEY);

  const startDateParam = searchParams.get(START_DATE_FILTER_KEY);
  const endDateParam = searchParams.get(END_DATE_FILTER_KEY);
  const regionParam = searchParams.get(REGION_FILTER_KEY);

  const href = useMemo(
    () =>
      pathname +
      "?" +
      new URLSearchParams({
        [START_DATE_FILTER_KEY]: startDateSelected,
        [END_DATE_FILTER_KEY]: endDateSelected,
        ...(regionsSelected.length !== ALL_REGION_OPTIONS.length && {
          [REGION_FILTER_KEY]: regionsSelected.join(","),
        }),
      }).toString(),
    [startDateSelected, endDateSelected, regionsSelected]
  );

  const startDateTag = startDateParam ? (
    <Pill>Start date: {startDateParam}</Pill>
  ) : null;
  const endDateTag = endDateParam ? (
    <Pill>End date: {endDateParam}</Pill>
  ) : null;
  const regionTag = regionParam ? (
    <Pill>Regions: {regionParam.split(",").join(" || ")}</Pill>
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
                {regionTag}
              </Group>
            )}
          </Group>
        </AccordionControl>
        <AccordionPanel>
          <Group gap="xl" align="flex-start">
            <DateFilter
              tournaments={tournaments}
              startDate={startDateSelected}
              setStartDate={setStartDateSelected}
              endDate={endDateSelected}
              setEndDate={setEndDateSelected}
            />
            <RegionFilter
              regions={regionsSelected}
              setRegions={setRegionsSelected}
            />
          </Group>
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
