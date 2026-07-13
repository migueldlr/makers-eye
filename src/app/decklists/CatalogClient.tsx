"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { IconExternalLink, IconSearch } from "@tabler/icons-react";
import { Text, TextInput } from "@mantine/core";
import type {
  CatalogDeckSnapshot,
  CatalogDeckSummary,
  CatalogEntrantSummary,
  CatalogEventSummary,
  DeckSide,
} from "@/lib/catalog/types";
import {
  catalogEntrantMatchesSearch,
  catalogEventMatchesSearch,
  catalogEventMetadataMatchesSearch,
  normalizeCatalogText,
} from "@/lib/catalog/util";
import { shortenId } from "@/lib/util";
import styles from "./catalog.module.css";

type LoadedDecks = Partial<Record<DeckSide, CatalogDeckSnapshot>>;
type DeckErrors = Partial<Record<DeckSide, string>>;

function identityLabel(identity: string): string {
  return identity ? shortenId(identity) : "Identity unavailable";
}

function DeckCards({ deck }: { deck: CatalogDeckSnapshot }) {
  return (
    <section className={styles.loadedDeck} aria-label={`${deck.side} decklist`}>
      <header className={styles.loadedDeckHeader}>
        <div>
          <div className={styles.sideLabel}>
            {deck.side === "corp" ? "Corp" : "Runner"}
          </div>
          <div className={styles.deckTitle}>{deck.title || "Submitted deck"}</div>
          <div className={styles.identity}>{identityLabel(deck.identity)}</div>
        </div>
        {deck.nrdbUrl && (
          <a
            className={styles.externalLink}
            href={deck.nrdbUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            NRDB <IconExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </header>
      {deck.cards.length === 0 ? (
        <div className={styles.missingDeck}>No cards were stored for this Cobra list.</div>
      ) : (
        <>
          <table className={styles.cardTable}>
            <tbody>
              {deck.cards.map((card, index) => (
                <tr key={`${card.id ?? card.title}-${index}`}>
                  <td className={styles.quantity}>{card.quantity}x</td>
                  <td>{card.title}</td>
                  <td className={styles.influence}>
                    {card.influence == null || card.influence === 0
                      ? ""
                      : card.influence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className={styles.deckFooter}>
            <span>{deck.cardCount} cards</span>
            {deck.influenceTotal != null && (
              <span>{deck.influenceTotal} influence</span>
            )}
          </footer>
        </>
      )}
    </section>
  );
}

function DeckCell({
  deck,
  fallbackIdentity,
  side,
}: {
  deck?: CatalogDeckSummary;
  fallbackIdentity: string;
  side: DeckSide;
}) {
  const identity = identityLabel(deck?.identity || fallbackIdentity);
  return (
    <div className={styles.deckCell}>
      <span className={styles.deckIdentity}>{identity}</span>
      {deck?.id ? (
        <div className={styles.deckCellActions}>
          <span className={styles.listAvailable}>{deck.cardCount} cards</span>
          {deck.nrdbUrl && (
            <a
              className={styles.nrdbLink}
              href={deck.nrdbUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`View ${side} deck on NetrunnerDB`}
            >
              NRDB <IconExternalLink size={10} aria-hidden="true" />
            </a>
          )}
        </div>
      ) : (
        <span className={styles.noList}>No Cobra list</span>
      )}
    </div>
  );
}

function MissingDeck({ side, identity }: { side: DeckSide; identity: string }) {
  return (
    <section className={styles.missingDeckPanel} aria-label={`${side} decklist`}>
      <div className={styles.sideLabel}>
        {side === "corp" ? "Corp" : "Runner"}
      </div>
      <div className={styles.identity}>{identityLabel(identity)}</div>
      <div className={styles.missingDeck}>No Cobra list available.</div>
    </section>
  );
}

function EntrantRows({
  entrant,
  eventId,
}: {
  entrant: CatalogEntrantSummary;
  eventId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState<LoadedDecks>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<DeckErrors>({});

  const toggleDecks = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    const sides = ["corp", "runner"] as const;
    const sidesToLoad = sides.filter(
      (side) => entrant.decks[side]?.id && !loaded[side]
    );
    if (sidesToLoad.length === 0) return;

    setLoading(true);
    setErrors({});
    const nextErrors: DeckErrors = {};
    const fetched = await Promise.all(
      sidesToLoad.map(async (side) => {
        const deckId = entrant.decks[side]?.id;
        if (!deckId) return null;
        try {
          const response = await fetch(`/decklists/decks/${deckId}`);
          if (!response.ok) {
            throw new Error("The stored decklist could not be loaded.");
          }
          return {
            side,
            deck: (await response.json()) as CatalogDeckSnapshot,
          };
        } catch (caught) {
          nextErrors[side] =
            caught instanceof Error
              ? caught.message
              : "The stored decklist could not be loaded.";
          return null;
        }
      })
    );
    setLoaded((current) => {
      const next = { ...current };
      for (const result of fetched) {
        if (result) next[result.side] = result.deck;
      }
      return next;
    });
    setErrors(nextErrors);
    setLoading(false);
  };

  const rowKey = `${eventId}-${entrant.swissRank}-${entrant.name}`;
  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("a, button")) return;
    void toggleDecks();
  };

  return (
    <>
      <tr className={styles.entrantRow} onClick={handleRowClick}>
        <td className={styles.rankCell}>{entrant.swissRank}</td>
        <td className={styles.cutCell}>{entrant.topCutRank ?? "-"}</td>
        <td>
          <button
            className={styles.entrantToggle}
            type="button"
            onClick={() => void toggleDecks()}
            aria-expanded={expanded}
            aria-controls={`${rowKey}-detail`}
            aria-label={`${expanded ? "Hide" : "Open"} decklists for ${entrant.name}`}
          >
            <span className={styles.playerName}>{entrant.name}</span>
          </button>
        </td>
        <td>
          <DeckCell
            side="corp"
            deck={entrant.decks.corp}
            fallbackIdentity={entrant.corpIdentity}
          />
        </td>
        <td>
          <DeckCell
            side="runner"
            deck={entrant.decks.runner}
            fallbackIdentity={entrant.runnerIdentity}
          />
        </td>
      </tr>
      {expanded && (
        <tr
          className={styles.deckDetailRow}
          id={`${rowKey}-detail`}
          key={`${rowKey}-detail`}
        >
          <td colSpan={5}>
            <div className={styles.expandedDeckGrid}>
              {(["corp", "runner"] as const).map((side) =>
                errors[side] ? (
                  <div className={styles.deckError} role="alert" key={side}>
                    {errors[side]}
                  </div>
                ) : loaded[side] ? (
                  <DeckCards deck={loaded[side]} key={side} />
                ) : loading && entrant.decks[side]?.id ? (
                  <div className={styles.deckStatus} role="status" key={side}>
                    Loading stored Cobra list...
                  </div>
                ) : (
                  <MissingDeck
                    side={side}
                    identity={
                      side === "corp"
                        ? entrant.corpIdentity
                        : entrant.runnerIdentity
                    }
                    key={side}
                  />
                )
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function visibleEvents(events: CatalogEventSummary[], query: string) {
  const normalized = normalizeCatalogText(query);
  if (!normalized) return events;
  return events.flatMap((event) => {
    if (!catalogEventMatchesSearch(event, normalized)) return [];
    if (catalogEventMetadataMatchesSearch(event, normalized)) return [event];
    const entrants = event.entrants.filter((entrant) =>
      catalogEntrantMatchesSearch(entrant, normalized)
    );
    return entrants.length > 0 ? [{ ...event, entrants }] : [];
  });
}

export function CatalogClient({ events }: { events: CatalogEventSummary[] }) {
  const [query, setQuery] = useState("");
  const filteredEvents = useMemo(
    () => visibleEvents(events, query),
    [events, query]
  );

  return (
    <>
      <TextInput
        className={styles.search}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        leftSection={<IconSearch size={18} aria-hidden="true" />}
        placeholder="Search player, event, or date"
        aria-label="Search tournament entrants"
      />
      {filteredEvents.length === 0 ? (
        <div className={styles.empty}>
          <Text fw={650}>No events or entrants match this search.</Text>
          <Text size="sm" mt={6}>
            Try a player handle, tournament name, or date.
          </Text>
        </div>
      ) : (
        <div className={styles.eventList}>
          {filteredEvents.map((event) => (
            <section className={styles.eventLedger} key={event.id}>
              <header className={styles.eventHeader}>
                <div>
                  <h2 className={styles.eventName}>{event.name}</h2>
                  <div className={styles.eventMeta}>
                    {[event.displayDate, event.location, event.cardpool ?? event.format]
                      .filter(Boolean)
                      .join(" / ")}
                  </div>
                </div>
                <div className={styles.eventActions}>
                  <div className={styles.coverage}>
                    TOP {event.cutSize} / {event.deckCount} LISTS
                  </div>
                  <div className={styles.eventLinks}>
                    {event.cobraUrl && (
                      <a
                        className={styles.externalLink}
                        href={event.cobraUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Cobra <IconExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                    {event.abrUrl && (
                      <a
                        className={styles.externalLink}
                        href={event.abrUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        ABR <IconExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </header>
              <div className={styles.ledgerScroll}>
                <table className={styles.entrantTable}>
                  <thead>
                    <tr>
                      <th scope="col">Swiss</th>
                      <th scope="col">Cut</th>
                      <th scope="col">Player</th>
                      <th scope="col">Corp</th>
                      <th scope="col">Runner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.entrants.map((entrant) => (
                      <EntrantRows
                        key={`${event.id}-${entrant.swissRank}-${entrant.name}`}
                        entrant={entrant}
                        eventId={event.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
