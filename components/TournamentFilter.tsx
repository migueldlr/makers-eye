"use client";

import { TournamentRow } from "@/lib/localtypes";
import {
  DEFAULT_NONE,
  END_DATE_FILTER_KEY,
  ONLINE_FILTER_KEY,
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
import OnlineFilter from "./OnlineFilter";

export const ALL_REGION_OPTIONS = [...REGION_OPTIONS, DEFAULT_NONE];
export const ONLINE_OPTIONS = ["Online", "Paper"];

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
  const initialOnline_raw = searchParams.get(ONLINE_FILTER_KEY);
  const initialOnline = (initialOnline_raw ?? "")
    .split(",")
    .filter((x) => x.length > 0);
  const [onlineSelected, setOnlineSelected] = useState(
    initialOnline.length > 0 ? initialOnline : ONLINE_OPTIONS
  );

  const hasFilters =
    searchParams.has(START_DATE_FILTER_KEY) ||
    searchParams.has(END_DATE_FILTER_KEY) ||
    searchParams.has(REGION_FILTER_KEY) ||
    searchParams.has(ONLINE_FILTER_KEY);

  const startDateParam = searchParams.get(START_DATE_FILTER_KEY);
  const endDateParam = searchParams.get(END_DATE_FILTER_KEY);
  const regionParam = searchParams.get(REGION_FILTER_KEY);
  const onlineParam = searchParams.get(ONLINE_FILTER_KEY);

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
        ...(onlineSelected.length !== ONLINE_OPTIONS.length && {
          [ONLINE_FILTER_KEY]: onlineSelected.join(","),
        }),
      }).toString(),
    [startDateSelected, endDateSelected, regionsSelected, onlineSelected]
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
  const onlineTag = onlineParam ? (
    <Pill>Location: {onlineParam.split(",").join(" || ")}</Pill>
  ) : null;

  console.log({ startDateSelected, endDateSelected });

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
            <Group>
              {startDateTag}
              {endDateTag}
              {regionTag}
              {onlineTag}
            </Group>
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
            <OnlineFilter
              online={onlineSelected}
              setOnline={setOnlineSelected}
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
