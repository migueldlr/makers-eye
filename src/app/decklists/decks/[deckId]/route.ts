import { NextResponse } from "next/server";
import { getPublishedCatalogDeck } from "@/lib/catalog/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params;
  const id = Number(deckId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid deck ID." }, { status: 400 });
  }

  const deck = await getPublishedCatalogDeck(id);
  if (!deck) {
    return NextResponse.json({ error: "Decklist not found." }, { status: 404 });
  }

  return NextResponse.json(deck, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
