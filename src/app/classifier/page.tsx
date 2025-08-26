"use client";

import {
  Button,
  Container,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { getAllCards } from "./actions";
import DecklistDisplay from "@/components/classifier/DecklistDisplay";
import { Decklist } from "@/app/mlstuff/page";
import { getArchetype, getIdentity } from "@/lib/util";

export default function Page() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [decklist, setDecklist] = useState<Decklist>([]);

  const load = async () => {
    setLoading(true);
    if (!url.includes("netrunnerdb.com")) {
      setError("NRDB URL please");
      setLoading(false);
      return;
    }
    const decklistId = url.split("/").pop();
    if (!decklistId) {
      setError("Invalid URL");
      setLoading(false);
      return;
    }
    if (Number.isNaN(Number(decklistId))) {
      setError("Invalid URL");
      setLoading(false);
      return;
    }
    try {
      const cards = await getAllCards({ decklistId: Number(decklistId) });
      setDecklist(cards);
      setLoading(false);
    } catch (e) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const side = getIdentity(decklist);

  return (
    <Container pt="xl">
      <Title>Deck Classifier</Title>
      <Stack align="start">
        <TextInput
          type="url"
          error={error}
          value={url}
          onChange={(e) => {
            setError("");
            setUrl(e.target.value);
          }}
          label="NRDB legacy URL"
          placeholder="https://netrunnerdb.com/en/decklist/XXXXXX"
        />

        <Button onClick={load} loading={loading}>
          Check
        </Button>

        {decklist.length > 0 && (
          <Text>Calculated archetype: {getArchetype(decklist)}</Text>
        )}

        {decklist.length > 0 && <DecklistDisplay decklist={decklist} />}
      </Stack>
    </Container>
  );
}
