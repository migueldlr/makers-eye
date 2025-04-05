"use server";

import { createClient } from "@/utils/supabase/server";

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
