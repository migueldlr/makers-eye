"use server";

import { createClient } from "@/utils/supabase/server";
import {
  compositionSimilarity,
  cosineSimilarity,
  euclideanDistance,
  jaccardSimilarity,
  sameIdentity,
  weightedJaccardSimilarity,
} from "./math";

export async function getSimilarity(decklist1: string, decklist2: string) {
  const supabase = await createClient();
  const { data: decklist1Data, error: decklist1Error } = await supabase
    .from("decklists")
    .select()
    .eq("id", decklist1);
  const { data: decklist2Data, error: decklist2Error } = await supabase
    .from("decklists")
    .select()
    .eq("id", decklist2);
  if (decklist1Error) {
    throw new Error("Error fetching decklists", decklist1Error);
  }
  if (decklist2Error) {
    throw new Error("Error fetching decklists", decklist2Error);
  }
  if (!decklist1Data || !decklist2Data) {
    throw new Error("No decklists found");
  }

  console.log(decklist1Data[0].cards);
}

export async function getCardList({ decklistId }: { decklistId: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_decklist_cards", {
    decklist_id: decklistId,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return data;
}

export async function getDecklistsBySide(side: "corp" | "runner") {
  const supabase = await createClient();

  const column = side === "corp" ? "corp_deck_id" : "runner_deck_id";
  const { data, error } = await supabase
    .from("standings")
    .select(column)
    .not(column, "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  /// @ts-ignore
  const ids = Array.from(new Set(data.map((d) => d[column])));
  ids.sort();

  const idToCardsMap: { [k: number]: any } = {};

  const cardLists = await Promise.all(
    ids.map(async (id) => {
      const cards = await getCardList({ decklistId: id });
      return { id, cards };
    })
  );

  cardLists.forEach((cardList) => {
    idToCardsMap[cardList.id] = cardList.cards;
  });

  const pairWiseSimilarities = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const decklist1 = idToCardsMap[ids[i]];
      const decklist2 = idToCardsMap[ids[j]];

      pairWiseSimilarities.push({
        decklist1: ids[i],
        decklist2: ids[j],
        cosine: cosineSimilarity(decklist1, decklist2),
        euclidean: euclideanDistance(decklist1, decklist2),
        jaccard: jaccardSimilarity(decklist1, decklist2),
        weightedJaccard: weightedJaccardSimilarity(decklist1, decklist2),
        sameIdentity: sameIdentity(decklist1, decklist2),
        composition: compositionSimilarity(decklist1, decklist2),
      });
    }
  }

  console.log(pairWiseSimilarities.length);
  return { idToCardsMap, pairWiseSimilarities };
}
