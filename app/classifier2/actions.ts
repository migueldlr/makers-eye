"use server";

import { createClient } from "@/utils/supabase/server";

export async function getArchetypes(ids: number[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("decklists")
    .select("id, archetype")
    .in("id", ids);
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return [];
  }
  return data;
}

export async function uploadArchetype(archetype: string, decklistId: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("decklists")
    .update({ archetype: archetype })
    .eq("id", decklistId);
  if (error) {
    throw new Error(error.message);
  }
  return true;
}
