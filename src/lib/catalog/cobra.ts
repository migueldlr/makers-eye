import * as cheerio from "cheerio";
import type { CatalogDeckSnapshot, DeckCardRow, DeckSide } from "./types";
import { fetchTextWithValidators } from "./http";

type ParsedCobraDeck = Omit<
  CatalogDeckSnapshot,
  | "standingId"
  | "sourceKind"
  | "sourceUrl"
  | "sourceHash"
  | "nrdbHash"
  | "comparisonStatus"
> & { identityPrintingId?: string };

type CobraDeckPayload = {
  details?: {
    side_id?: unknown;
    name?: unknown;
    identity_title?: unknown;
    identity_nrdb_printing_id?: unknown;
  };
  cards?: Array<{
    title?: unknown;
    quantity?: unknown;
    influence?: unknown;
    card_type_id?: unknown;
    nrdb_printing_id?: unknown;
  }>;
};

function cleanText(value: string): string {
  return value
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function numberFromText(value: string): number | null {
  const parsed = Number.parseInt(cleanText(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberFromUnknown(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseEmbeddedDeck(
  $: cheerio.CheerioAPI,
  side: DeckSide
): ParsedCobraDeck | null {
  const value = $(`#${side}_deck`).attr("value");
  if (!value) return null;

  let payload: CobraDeckPayload;
  try {
    payload = JSON.parse(value) as CobraDeckPayload;
  } catch {
    return null;
  }
  if (payload.details?.side_id !== side || !Array.isArray(payload.cards)) {
    return null;
  }

  const cards = payload.cards.flatMap((card): DeckCardRow[] => {
    const title = typeof card.title === "string" ? cleanText(card.title) : "";
    const quantity = numberFromUnknown(card.quantity);
    const influence = numberFromUnknown(card.influence);
    const type =
      typeof card.card_type_id === "string"
        ? cleanText(card.card_type_id)
        : "";
    const id =
      typeof card.nrdb_printing_id === "string"
        ? card.nrdb_printing_id.trim()
        : "";
    if (!title || quantity == null) return [];
    return [
      {
        ...(id ? { id } : {}),
        title,
        quantity,
        ...(influence != null ? { influence } : {}),
        ...(type ? { type } : {}),
      },
    ];
  });
  if (cards.length === 0) return null;

  return {
    side,
    title:
      typeof payload.details.name === "string"
        ? cleanText(payload.details.name)
        : "",
    identity:
      typeof payload.details.identity_title === "string"
        ? cleanText(payload.details.identity_title)
        : "",
    cards,
    cardCount: cards.reduce((total, card) => total + card.quantity, 0),
    influenceTotal: cards.reduce(
      (total, card) => total + (card.influence ?? 0),
      0
    ),
    nrdbUrl: null,
    ...(typeof payload.details.identity_nrdb_printing_id === "string"
      ? {
          identityPrintingId:
            payload.details.identity_nrdb_printing_id.trim(),
        }
      : {}),
  };
}

export function parseCobraDeckPage(
  html: string
): Partial<Record<DeckSide, ParsedCobraDeck>> {
  const $ = cheerio.load(html);
  const tables = $("table").toArray();
  const embeddedCorp = parseEmbeddedDeck($, "corp");
  const embeddedRunner = parseEmbeddedDeck($, "runner");
  const output: Partial<Record<DeckSide, ParsedCobraDeck>> = {
    ...(embeddedCorp ? { corp: embeddedCorp } : {}),
    ...(embeddedRunner ? { runner: embeddedRunner } : {}),
  };

  for (let index = 0; index < tables.length; index += 1) {
    const heading = cleanText($(tables[index]).find("th").first().text());
    const side: DeckSide | null =
      heading === "Corp Deck"
        ? "corp"
        : heading === "Runner Deck"
        ? "runner"
        : null;
    if (!side) continue;

    const title = cleanText(
      $(tables[index]).find("tbody tr td").first().text()
    );
    const identityTable = tables[index + 1];
    const cardsTable = tables[index + 2];
    const totalsTable = tables[index + 3];
    if (!identityTable || !cardsTable) continue;

    const identityCells = $(identityTable).find("tbody tr").first().find("td");
    const identity = cleanText(identityCells.eq(1).text());
    const cards: DeckCardRow[] = [];

    $(cardsTable)
      .find("tbody tr")
      .each((_rowIndex, row) => {
        const cells = $(row).find("td");
        const quantity = numberFromText(cells.eq(0).text());
        const cardTitle = cleanText(cells.eq(1).text());
        const influence = numberFromText(cells.eq(2).text());
        if (quantity == null || cardTitle === "") return;
        cards.push({
          title: cardTitle,
          quantity,
          ...(influence != null ? { influence } : {}),
        });
      });

    const totalCells = totalsTable
      ? $(totalsTable).find("tbody tr").first().find("td")
      : null;
    const cardCount =
      (totalCells && numberFromText(totalCells.eq(0).text())) ??
      cards.reduce((total, card) => total + card.quantity, 0);
    const influenceTotal = totalCells
      ? numberFromText(totalCells.eq(2).text())
      : null;

    if (cards.length > 0) {
      output[side] = {
        side,
        title,
        identity,
        cards,
        cardCount,
        influenceTotal,
        nrdbUrl: null,
      };
    }
  }

  return output;
}

export async function fetchCobraDeckPage(url: string) {
  const response = await fetchTextWithValidators(url, {
    headers: { Accept: "text/html" },
  });
  if (!response.ok) {
    throw new Error(`Cobra returned ${response.status}.`);
  }
  return parseCobraDeckPage(response.body);
}
