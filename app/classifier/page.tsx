"use client";

import {
  Box,
  Button,
  Container,
  Group,
  List,
  ListItem,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import useAuth from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { getCardList, getSimilarity } from "./actions";
import DecklistDisplay from "@/components/classifier/DecklistDisplay";

export type Decklist = {
  card_name: string;
  card_type: string;
  card_count: number;
}[];

function cosineSimilarity(decklist1: Decklist, decklist2: Decklist) {
  const allCardIds = Array.from(
    new Set([
      ...decklist1.map((c) => c.card_name),
      ...decklist2.map((c) => c.card_name),
    ])
  );

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const cardId of allCardIds) {
    const count1 = decklist1.find((c) => c.card_name === cardId)?.card_count;
    const count2 = decklist2.find((c) => c.card_name === cardId)?.card_count;
    if (count1 === undefined || count2 === undefined) {
      continue;
    }
    dotProduct += count1 * count2;
    magA += count1 * count1;
    magB += count2 * count2;
  }
  const similarity = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
  return similarity;
}

function euclideanDistance(decklist1: Decklist, decklist2: Decklist) {
  const allCardIds = Array.from(
    new Set([
      ...decklist1.map((c) => c.card_name),
      ...decklist2.map((c) => c.card_name),
    ])
  );
  let sumOfSquares = 0;
  for (const cardId of allCardIds) {
    const count1 = decklist1.find((c) => c.card_name === cardId)?.card_count;
    const count2 = decklist2.find((c) => c.card_name === cardId)?.card_count;
    if (count1 === undefined || count2 === undefined) {
      continue;
    }
    sumOfSquares += Math.pow(count1 - count2, 2);
  }

  const distance = Math.sqrt(sumOfSquares);
  return distance;
}

function jaccardSimilarity(decklist1: Decklist, decklist2: Decklist) {
  const cards1 = new Set(decklist1.map((c) => c.card_name));
  const cards2 = new Set(decklist2.map((c) => c.card_name));

  const intersection = new Set(
    Array.from(cards1).filter((card) => cards2.has(card))
  );
  const union = new Set([...Array.from(cards1), ...Array.from(cards2)]);

  return intersection.size / union.size;
}

function weightedJaccardSimilarity(decklist1: Decklist, decklist2: Decklist) {
  const allCardIds = Array.from(
    new Set([
      ...decklist1.map((c) => c.card_name),
      ...decklist2.map((c) => c.card_name),
    ])
  );

  let minSum = 0;
  let maxSum = 0;

  for (const cardId of allCardIds) {
    const count1 = decklist1.find((c) => c.card_name === cardId)?.card_count;
    const count2 = decklist2.find((c) => c.card_name === cardId)?.card_count;
    if (count1 === undefined || count2 === undefined) {
      continue;
    }
    minSum += Math.min(count1, count2);
    maxSum += Math.max(count1, count2);
  }

  return minSum / maxSum;
}

export default function ClassifierPage() {
  const user = useAuth();
  const [decklistId1, setDecklistId1] = useState("86412");
  const [decklistId2, setDecklistId2] = useState("86389");

  const [decklist1, setDecklist1] = useState<Decklist>();
  const [decklist2, setDecklist2] = useState<Decklist>();

  useEffect(() => {
    (async () => {
      const decklist = await getCardList({ decklistId: Number(decklistId1) });
      if (decklist) {
        console.log(decklist);
        setDecklist1(decklist);
      }
    })();
  }, [decklistId1]);

  useEffect(() => {
    (async () => {
      const decklist = await getCardList({ decklistId: Number(decklistId2) });
      if (decklist) {
        console.log(decklist);
        setDecklist2(decklist);
      }
    })();
  }, [decklistId2]);

  if (!user) {
    return null;
  }

  return (
    <Container pt="xl">
      <Stack align="start">
        <Title order={3}>Classifier</Title>

        <Title order={4}>Similarity checker</Title>
        {decklist1 && decklist2 && (
          <Box>
            <List>
              <ListItem>
                Cosine similarity:{" "}
                {cosineSimilarity(decklist1, decklist2).toFixed(4)}
              </ListItem>
              <ListItem>
                Euclidean distance:{" "}
                {euclideanDistance(decklist1, decklist2).toFixed(4)}
              </ListItem>
              <ListItem>
                Jaccard similarity:{" "}
                {jaccardSimilarity(decklist1, decklist2).toFixed(4)}
              </ListItem>
              <ListItem>
                Weighted Jaccard similarity:{" "}
                {weightedJaccardSimilarity(decklist1, decklist2).toFixed(4)}
              </ListItem>
            </List>
          </Box>
        )}
        <Group align="start">
          <Stack w="400">
            <TextInput
              value={decklistId1}
              onChange={(e) => setDecklistId1(e.target.value)}
            />
            {decklist1 && <DecklistDisplay decklist={decklist1} />}
          </Stack>
          <Stack w="400">
            <TextInput
              value={decklistId2}
              onChange={(e) => setDecklistId2(e.target.value)}
            />
            {decklist2 && <DecklistDisplay decklist={decklist2} />}
          </Stack>
        </Group>
      </Stack>
    </Container>
  );
}
