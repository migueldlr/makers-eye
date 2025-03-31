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
  Stack,
  Title,
  Text,
  Kbd,
} from "@mantine/core";
import { useHotkeys, useOs } from "@mantine/hooks";
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
  const [sticky, setSticky] = useState(true);
  const toggleSticky = () => setSticky(sticky ? false : true);
  const os = useOs();
  useHotkeys([["alt+F", toggleSticky]]);

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
        ...(startDateSelected && {
          [START_DATE_FILTER_KEY]: startDateSelected,
        }),
        ...(endDateSelected && { [END_DATE_FILTER_KEY]: endDateSelected }),
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
    <Pill>Regions: {regionParam.split(",").join(", ")}</Pill>
  ) : null;
  const onlineTag = onlineParam ? (
    <Pill>Location: {onlineParam.split(",").join(", ")}</Pill>
  ) : null;

  const tournamentsFiltered = useMemo(
    () =>
      tournaments
        .filter(
          (t) =>
            regionsSelected.length === 0 ||
            regionsSelected.includes(t.region ?? DEFAULT_NONE)
        )
        .filter(
          (t) =>
            onlineSelected.length === 0 ||
            onlineSelected.includes(t.location ?? "Paper")
        ),
    [regionsSelected, onlineSelected]
  );

  return (
    <Accordion
      defaultValue="filters"
      variant="filled"
      pos={sticky ? "sticky" : "unset"}
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
              {regionTag}
              {onlineTag}
              {startDateTag}
              {endDateTag}
            </Group>
          </Group>
        </AccordionControl>
        <AccordionPanel>
          <Group gap="xl" align="flex-start">
            <Stack>
              <RegionFilter
                regions={regionsSelected}
                setRegions={setRegionsSelected}
              />
              <OnlineFilter
                online={onlineSelected}
                setOnline={setOnlineSelected}
              />
            </Stack>
            <DateFilter
              tournaments={tournamentsFiltered}
              startDate={startDateSelected}
              setStartDate={setStartDateSelected}
              endDate={endDateSelected}
              setEndDate={setEndDateSelected}
            />
          </Group>
          <Group mt="lg" style={{ justifyContent: "space-between" }}>
            <Group>
              <Button component={Link} href={href} scroll={false}>
                Filter
              </Button>
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
            </Group>
            <Button variant="outline" color="gray" onClick={toggleSticky}>
              {sticky ? "Unstick from top" : "Stick to top"}
              {os === "macos" || os === "windows" ? (
                <>
                  {" ("}
                  <Kbd>{os === "macos" ? "⌥" : "Alt"}</Kbd> + <Kbd>F</Kbd> {")"}
                </>
              ) : null}
            </Button>
          </Group>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
