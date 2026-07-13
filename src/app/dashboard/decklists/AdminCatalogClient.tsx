"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Accordion,
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconChevronLeft, IconExternalLink, IconX } from "@tabler/icons-react";
import type {
  CatalogAdminEventSummary,
  CatalogEventDetail,
  CatalogPlayerMapping,
  CatalogRefreshPreview,
  DeckSide,
} from "@/lib/catalog/types";
import {
  importAndPublishCatalogEvent,
  previewCatalogRefresh,
  removeCatalogNrdbLink,
  saveCatalogEvent,
  saveCatalogPlayerLinks,
} from "./actions";
import styles from "./admin.module.css";

type LinkState = Record<
  number,
  { sourcePlayerId: string; corpNrdbUrl: string; runnerNrdbUrl: string }
>;

export function AdminCatalogClient({
  events,
  selectedEvent,
}: {
  events: CatalogAdminEventSummary[];
  selectedEvent: CatalogEventDetail | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [preview, setPreview] = useState<CatalogRefreshPreview | null>(null);
  const [abrMappings, setAbrMappings] = useState<Record<number, string>>( {} );
  const [eventForm, setEventForm] = useState(() => ({
    name: selectedEvent?.name ?? "",
    date: selectedEvent?.date ?? "",
    location: selectedEvent?.location ?? "",
    region: selectedEvent?.region ?? "",
    format: selectedEvent?.format ?? "",
    cardpool: selectedEvent?.cardpool ?? "",
    sourceUrl: selectedEvent?.sourceUrl ?? "",
    abrUrl: selectedEvent?.abrUrl ?? "",
    published: selectedEvent?.published ?? false,
  }));
  const [links, setLinks] = useState<LinkState>(() =>
    Object.fromEntries(
      (selectedEvent?.players ?? []).map((player) => [
        player.id,
        {
          sourcePlayerId: player.sourcePlayerId ?? "",
          corpNrdbUrl: player.decks.corp?.nrdbUrl ?? "",
          runnerNrdbUrl: player.decks.runner?.nrdbUrl ?? "",
        },
      ])
    )
  );
  const hasImportedDecklists =
    selectedEvent?.players.some((player) =>
      Object.values(player.decks).some((deck) => (deck?.cardCount ?? 0) > 0)
    ) ?? false;
  const hasPreviewDecklists =
    preview?.players.some((player) => Object.keys(player.decks).length > 0) ??
    false;
  const sourceLinkLabel = eventForm.sourceUrl.includes("tournaments.nullsignal.games")
    ? "Open Cobra"
    : "Open tournament source";
  const abrEventUrl = preview?.abrUrl ?? selectedEvent?.abrUrl ?? null;

  const sourceOptions = useMemo(
    () =>
      preview?.sourcePlayers.map((player) => ({
        value: player.id,
        label: player.name,
      })) ?? [],
    [preview]
  );
  const abrOptions = useMemo(
    () =>
      preview?.abrEntries.map((entry) => ({
        value: entry.key,
        label: `${entry.name} / Swiss ${entry.rankSwiss}`,
      })) ?? [],
    [preview]
  );

  const run = (
    operation: () => Promise<unknown>,
    success: string,
    { refresh = true }: { refresh?: boolean } = {}
  ) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await operation();
        setMessage({ kind: "success", text: success });
        if (refresh) router.refresh();
      } catch (error) {
        setMessage({
          kind: "error",
          text: error instanceof Error ? error.message : "The operation failed.",
        });
      }
    });
  };

  const mappings = (): CatalogPlayerMapping[] =>
    (selectedEvent?.players ?? []).map((player) => ({
      standingId: player.id,
      sourcePlayerId: links[player.id]?.sourcePlayerId || null,
      abrEntryKey: abrMappings[player.id] || null,
    }));

  const refreshPreview = () => {
    if (!selectedEvent) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await previewCatalogRefresh(selectedEvent.id, mappings());
        setPreview(result);
        if (result.abrAutoDetected && result.abrUrl) {
          setEventForm((current) => ({ ...current, abrUrl: result.abrUrl ?? "" }));
        }
        setLinks((current) => ({
          ...current,
          ...Object.fromEntries(
            result.players.map((player) => [
              player.standingId,
              {
                ...current[player.standingId],
                sourcePlayerId: player.sourcePlayerId ?? "",
                corpNrdbUrl:
                  player.decks.corp?.nrdbUrl ??
                  current[player.standingId]?.corpNrdbUrl ??
                  "",
                runnerNrdbUrl:
                  player.decks.runner?.nrdbUrl ??
                  current[player.standingId]?.runnerNrdbUrl ??
                  "",
              },
            ])
          ),
        }));
        setAbrMappings(
          Object.fromEntries(
            result.players.flatMap((player) =>
              player.abrEntryKey ? [[player.standingId, player.abrEntryKey]] : []
            )
          )
        );
      } catch (error) {
        setMessage({
          kind: "error",
          text: error instanceof Error ? error.message : "Refresh preview failed.",
        });
      }
    });
  };

  const saveEvent = (published: boolean, abrUrl = eventForm.abrUrl) => {
    if (!selectedEvent) return Promise.resolve();
    return saveCatalogEvent({
      id: selectedEvent.id,
      ...eventForm,
      published,
      location: eventForm.location || null,
      region: eventForm.region || null,
      format: eventForm.format || null,
      cardpool: eventForm.cardpool || null,
      sourceUrl: eventForm.sourceUrl || null,
      abrUrl: abrUrl || null,
    });
  };

  const togglePublished = () => {
    const published = !eventForm.published;
    run(async () => {
      await saveEvent(published);
      setEventForm((current) => ({ ...current, published }));
    }, published ? "Event published." : "Event unpublished.");
  };

  const savePlayerLinkCorrections = () => {
    if (!selectedEvent) return Promise.resolve();
    return saveCatalogPlayerLinks({
      tournamentId: selectedEvent.id,
      players: selectedEvent.players.map((player) => ({
        standingId: player.id,
        sourcePlayerId: links[player.id]?.sourcePlayerId || null,
        corpNrdbUrl: links[player.id]?.corpNrdbUrl || null,
        runnerNrdbUrl: links[player.id]?.runnerNrdbUrl || null,
      })),
    });
  };

  const savePlayerLinkCorrectionsAndResetPreview = async () => {
    await savePlayerLinkCorrections();
    setPreview(null);
  };

  const importAndPublish = async () => {
    if (!selectedEvent || !preview) return;
    await importAndPublishCatalogEvent({
      event: {
        id: selectedEvent.id,
        ...eventForm,
        location: eventForm.location || null,
        region: eventForm.region || null,
        format: eventForm.format || null,
        cardpool: eventForm.cardpool || null,
        sourceUrl: eventForm.sourceUrl || null,
        abrUrl: eventForm.abrUrl || null,
      },
      preview,
    });
    setEventForm((current) => ({
      ...current,
      abrUrl: preview.abrUrl ?? current.abrUrl,
      published: true,
    }));
  };

  const removeNrdbLink = (standingId: number, side: DeckSide) => {
    if (!selectedEvent) return;
    run(async () => {
      await removeCatalogNrdbLink({
        tournamentId: selectedEvent.id,
        standingId,
        side,
      });
      const linkKey = side === "corp" ? "corpNrdbUrl" : "runnerNrdbUrl";
      setLinks((current) => ({
        ...current,
        [standingId]: {
          ...current[standingId],
          [linkKey]: "",
        },
      }));
      setPreview((current) =>
        current
          ? {
              ...current,
              players: current.players.map((player) => {
                const deck = player.decks[side];
                return player.standingId === standingId && deck
                  ? {
                      ...player,
                      decks: {
                        ...player.decks,
                        [side]: {
                          ...deck,
                          nrdbUrl: null,
                          nrdbHash: null,
                          comparisonStatus: "unverified" as const,
                        },
                      },
                    }
                  : player;
              }),
            }
          : current
      );
    }, `${side === "corp" ? "Corp" : "Runner"} NRDB link removed.`, {
      refresh: false,
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Anchor component={Link} href="/dashboard" c="dimmed">
          <Group gap={5}><IconChevronLeft size={14} /> Dashboard</Group>
        </Anchor>
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrow}>Catalog control</div>
            <Title order={1}>Top cut decklists</Title>
            <Text c="dimmed" mt={6}>
              Review submitted lists, resolve source links, then publish an event.
            </Text>
          </div>
          <Button component={Link} href="/decklists" variant="light" color="orange">
            View public catalog
          </Button>
        </header>

        <div className={styles.eventList}>
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/decklists?event=${event.id}#catalog-editor`}
              className={`${styles.eventCard} ${
                selectedEvent?.id === event.id ? styles.selected : ""
              }`}
            >
              <Group justify="space-between" align="start" wrap="nowrap">
                <Text fw={650}>{event.name}</Text>
                <Badge color={event.published ? "green" : "gray"} variant="light">
                  {event.published ? "Published" : "Draft"}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={8} ff="monospace">
                {event.displayDate || "No date"} / Top {event.cutSize} / {event.deckCount} lists
              </Text>
            </Link>
          ))}
        </div>

        {selectedEvent && (
          <section className={styles.editor} id="catalog-editor" tabIndex={-1}>
            <Title order={2}>{selectedEvent.name}</Title>
            <Group gap="sm" mt="sm" className={styles.sourceLinks}>
              {eventForm.sourceUrl ? (
                <Button
                  component="a"
                  href={eventForm.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  variant="light"
                  size="compact-sm"
                  rightSection={<IconExternalLink size={13} />}
                >
                  {sourceLinkLabel}
                </Button>
              ) : (
                <Badge color="gray" variant="light">Tournament source not linked</Badge>
              )}
              {eventForm.abrUrl ? (
                <Button
                  component="a"
                  href={eventForm.abrUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  variant="light"
                  size="compact-sm"
                  rightSection={<IconExternalLink size={13} />}
                >
                  Open ABR
                </Button>
              ) : (
                <Badge color="gray" variant="light">ABR not linked</Badge>
              )}
            </Group>
            <Stack gap="xl" mt="lg">
              {message && (
                <Alert
                  color={message.kind === "error" ? "red" : "green"}
                  icon={<IconAlertCircle size={17} />}
                >
                  {message.text}
                </Alert>
              )}
              <div className={styles.workflow}>
                <section className={styles.workflowStep}>
                  <div className={styles.stepMarker}>1</div>
                  <div className={styles.stepContent}>
                    <Group justify="space-between" align="start" className={styles.stepHeader}>
                      <div>
                        <Title order={3}>Find decklists</Title>
                        <Text c="dimmed" size="sm">
                          Check Cobra for submitted lists and match the event and players on ABR.
                        </Text>
                        {abrEventUrl && (
                          <Anchor href={abrEventUrl} target="_blank" rel="noreferrer noopener" size="sm" mt={5}>
                            View matched ABR event <IconExternalLink size={12} />
                          </Anchor>
                        )}
                      </div>
                      <Group gap="sm">
                        <Badge color={preview ? "green" : "orange"} variant="light">
                          {preview ? "Preview ready" : "Not checked"}
                        </Badge>
                        <Button color="orange" variant="light" loading={pending} onClick={refreshPreview}>
                          {preview ? "Check again" : "Find decklists"}
                        </Button>
                      </Group>
                    </Group>

                    {preview && (
                      <Stack mt="md">
                        {preview.abrAutoDetected && preview.abrUrl && (
                          <Alert color="green" variant="light">
                            ABR tournament matched automatically. Its URL will be saved when you import.
                          </Alert>
                        )}
                        {preview.warnings.map((warning) => (
                          <Text key={warning} className={styles.warning}>{warning}</Text>
                        ))}
                        {preview.players.map((player) => {
                          const needsSourceMatch = player.sourceMatch !== "matched";
                          const needsAbrMatch =
                            preview.abrEntries.length > 0 && player.abrMatch !== "matched";
                          const deckStatus = (side: DeckSide) => {
                            const deck = player.decks[side];
                            if (!deck) {
                              return { color: "gray", label: `${side === "corp" ? "Corp" : "Runner"}: missing` };
                            }
                            if (deck.nrdbAutoMatched) {
                              return { color: "cyan", label: `${side === "corp" ? "Corp" : "Runner"}: NRDB auto-matched` };
                            }
                            return deck.nrdbUrl
                              ? { color: "green", label: `${side === "corp" ? "Corp" : "Runner"}: NRDB linked` }
                              : { color: "yellow", label: `${side === "corp" ? "Corp" : "Runner"}: no NRDB` };
                          };
                          return (
                            <div className={styles.previewPlayer} key={player.standingId}>
                              <Group justify="space-between" align="start">
                                <div>
                                  <Text fw={650}>{player.topCutRank}. {player.name}</Text>
                                  <Text size="xs" c="dimmed">Swiss seed {player.swissRank}</Text>
                                </div>
                                <Group gap="xs">
                                  {(["corp", "runner"] as const).map((side) => {
                                    const status = deckStatus(side);
                                    return <Badge color={status.color} key={side}>{status.label}</Badge>;
                                  })}
                                </Group>
                              </Group>
                              {(needsSourceMatch || needsAbrMatch) && (
                                <Group grow mt="sm" align="end">
                                  {needsSourceMatch && (
                                    <Select
                                      searchable
                                      clearable
                                      label="Resolve Cobra player match"
                                      placeholder="Choose the matching player"
                                      data={sourceOptions}
                                      value={links[player.standingId]?.sourcePlayerId || null}
                                      onChange={(value) => setLinks({ ...links, [player.standingId]: { ...links[player.standingId], sourcePlayerId: value ?? "" } })}
                                    />
                                  )}
                                  {needsAbrMatch && (
                                    <Select
                                      searchable
                                      clearable
                                      label="Resolve ABR player match"
                                      description={player.abrMatch === "ambiguous" ? "Multiple ABR players have this name." : "No ABR player matched automatically."}
                                      placeholder="Choose the matching player"
                                      data={abrOptions}
                                      value={abrMappings[player.standingId] || null}
                                      onChange={(value) => setAbrMappings({ ...abrMappings, [player.standingId]: value ?? "" })}
                                    />
                                  )}
                                </Group>
                              )}
                              {player.warnings.map((warning) => (
                                <Text key={warning} className={styles.warning} mt={6}>{warning}</Text>
                              ))}
                              <Group mt="sm" gap="lg">
                                {(["corp", "runner"] as const).map((side) => {
                                  const deck = player.decks[side];
                                  return deck ? (
                                    <Group gap={5} key={side} wrap="nowrap">
                                      <Text size="sm">
                                        {side.toUpperCase()}: {deck.title || deck.identity} / {deck.cardCount} cards
                                      </Text>
                                      {deck.nrdbUrl && (
                                        <>
                                          <Anchor href={deck.nrdbUrl} target="_blank" rel="noreferrer noopener" size="sm">
                                            NRDB <IconExternalLink size={11} />
                                          </Anchor>
                                          <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            loading={pending}
                                            aria-label={`Remove ${side} NRDB link for ${player.name}`}
                                            onClick={() => removeNrdbLink(player.standingId, side)}
                                          >
                                            <IconX size={13} />
                                          </ActionIcon>
                                        </>
                                      )}
                                    </Group>
                                  ) : null;
                                })}
                              </Group>
                            </div>
                          );
                        })}
                      </Stack>
                    )}
                  </div>
                </section>

                <section className={styles.workflowStep}>
                  <div className={styles.stepMarker}>2</div>
                  <div className={styles.stepContent}>
                    <Group justify="space-between" align="start" className={styles.stepHeader}>
                      <div>
                        <Title order={3}>{eventForm.published ? "Import updates" : "Import and publish"}</Title>
                        <Text c="dimmed" size="sm">
                          {eventForm.published
                            ? "Update the saved decklists while keeping this event public."
                            : "Save the reviewed decklists and make the event visible in the public catalog."}
                        </Text>
                      </div>
                      <Group gap="sm">
                        <Badge color={eventForm.published ? "green" : "gray"} variant="light">
                          {eventForm.published ? "Published" : hasImportedDecklists ? "Imported draft" : "Draft"}
                        </Badge>
                        <Button
                          color={eventForm.published ? "blue" : "green"}
                          loading={pending}
                          disabled={!preview || !hasPreviewDecklists}
                          onClick={() =>
                            run(
                              importAndPublish,
                              eventForm.published
                                ? "Decklists updated."
                                : "Decklists imported and event published."
                            )
                          }
                        >
                          {eventForm.published ? "Import updates" : "Import and publish"}
                        </Button>
                        {eventForm.published && (
                          <Button variant="subtle" color="gray" loading={pending} onClick={togglePublished}>
                            Unpublish
                          </Button>
                        )}
                      </Group>
                    </Group>
                  </div>
                </section>
              </div>

              <Accordion variant="separated" className={styles.advancedSettings}>
                <Accordion.Item value="event-details">
                  <Accordion.Control>
                    <Text fw={650}>Advanced: event details</Text>
                    <Text size="xs" c="dimmed">Edit catalog metadata and source URLs.</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      <div className={styles.formGrid}>
                        <TextInput label="Event name" value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.currentTarget.value })} />
                        <TextInput label="Date" type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.currentTarget.value })} />
                        <TextInput label="Location" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.currentTarget.value })} />
                        <TextInput label="Region" value={eventForm.region} onChange={(e) => setEventForm({ ...eventForm, region: e.currentTarget.value })} />
                        <TextInput label="Format" value={eventForm.format} onChange={(e) => setEventForm({ ...eventForm, format: e.currentTarget.value })} />
                        <TextInput label="Card pool" value={eventForm.cardpool} onChange={(e) => setEventForm({ ...eventForm, cardpool: e.currentTarget.value })} />
                        <TextInput className={styles.wide} label="Tournament source URL" value={eventForm.sourceUrl} onChange={(e) => setEventForm({ ...eventForm, sourceUrl: e.currentTarget.value })} />
                        <TextInput className={styles.wide} label="Always Be Running URL" value={eventForm.abrUrl} onChange={(e) => setEventForm({ ...eventForm, abrUrl: e.currentTarget.value })} />
                      </div>
                      <Group justify="flex-end">
                        <Button variant="light" loading={pending} onClick={() => run(() => saveEvent(eventForm.published), "Event details saved.")}>Save event details</Button>
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="link-corrections">
                  <Accordion.Control>
                    <Text fw={650}>Advanced: player link corrections</Text>
                    <Text size="xs" c="dimmed">Override automatic Cobra or NRDB links only when needed.</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <div className={styles.playerTable}>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Cut</Table.Th><Table.Th>Swiss</Table.Th><Table.Th>Player</Table.Th>
                            <Table.Th>Cobra player</Table.Th><Table.Th>Corp NRDB</Table.Th><Table.Th>Runner NRDB</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {selectedEvent.players.map((player) => (
                            <Table.Tr key={player.id}>
                              <Table.Td>{player.topCutRank}</Table.Td>
                              <Table.Td>{player.swissRank}</Table.Td>
                              <Table.Td>{player.name}</Table.Td>
                              <Table.Td><TextInput aria-label={`${player.name} Cobra player ID`} value={links[player.id]?.sourcePlayerId ?? ""} onChange={(e) => setLinks({ ...links, [player.id]: { ...links[player.id], sourcePlayerId: e.currentTarget.value } })} /></Table.Td>
                              <Table.Td><TextInput aria-label={`${player.name} Corp NRDB URL`} value={links[player.id]?.corpNrdbUrl ?? ""} onChange={(e) => setLinks({ ...links, [player.id]: { ...links[player.id], corpNrdbUrl: e.currentTarget.value } })} /></Table.Td>
                              <Table.Td><TextInput aria-label={`${player.name} Runner NRDB URL`} value={links[player.id]?.runnerNrdbUrl ?? ""} onChange={(e) => setLinks({ ...links, [player.id]: { ...links[player.id], runnerNrdbUrl: e.currentTarget.value } })} /></Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>
                    <Group justify="flex-end" mt="md">
                      <Button
                        variant="light"
                        loading={pending}
                        onClick={() =>
                          run(
                            savePlayerLinkCorrectionsAndResetPreview,
                            "Player link corrections saved. Find decklists again to review them.",
                            { refresh: false }
                          )
                        }
                      >
                        Save link corrections
                      </Button>
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </section>
        )}
      </div>
    </main>
  );
}
