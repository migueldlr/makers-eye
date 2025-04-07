"use server";

import { NRDB_URL } from "@/lib/util";
import { getDecklist } from "../stats/actions";
import { Decklist } from "../mlstuff/page";
import { NrdbCard } from "@/lib/nrdb";

export async function getAllCards({
  decklistId,
}: {
  decklistId: number;
}): Promise<Decklist> {
  const cards = await getDecklist({ decklistId });

  const cardIds = Object.keys(cards).map((id) => String(id).padStart(5, "0"));

  const mapIdToCard: { [key: string]: NrdbCard } = {};

  const cardData = await Promise.all(
    cardIds.map(async (id) => {
      const res = await fetch(`${NRDB_URL}/card/${id}`);

      const data = await res.json();
      console.log(data.data[0]);
      mapIdToCard[id] = data.data[0];
      return data.data[0];
    })
  );

  return Object.entries(cards).map(([id, count]) => {
    return {
      card_name: mapIdToCard[id].title,
      card_type: mapIdToCard[id].type_code,
      card_count: count,
    };
  });
}
