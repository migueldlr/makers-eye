"use client";

import {
  Anchor,
  Box,
  Button,
  Container,
  Group,
  List,
  ListItem,
  Pagination,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import useAuth from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { getCardList, getDecklistsBySide, getSimilarity } from "./actions";
import DecklistDisplay from "@/components/classifier/DecklistDisplay";
import { FeatureVector, OnlineLogisticRegression } from "./logreg";

function getNrdbLink(decklistId: string) {
  return `https://netrunnerdb.com/en/decklist/${decklistId}`;
}

export type Decklist = {
  card_name: string;
  card_type: string;
  card_count: number;
}[];

export type SimilarityData = {
  decklist1: number;
  decklist2: number;
  cosine: number;
  euclidean: number;
  jaccard: number;
  weightedJaccard: number;
  composition: number;
  sameIdentity: boolean;
};

const PAGE_SIZE = 10;

export default function ClassifierPage() {
  const user = useAuth();
  const side = "corp";

  const [idToCardsMap, setIdToCardsMap] = useState<{
    [key: number]: Decklist;
  }>({});
  const [pairwiseSimilarities, setPairwiseSimilarities] = useState<
    SimilarityData[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pair, setPair] = useState<SimilarityData>();

  const [model, setModel] = useState<OnlineLogisticRegression | null>(null);
  const [weights, setWeights] = useState<FeatureVector>({});
  const [bias, setBias] = useState(0);

  const load = async () => {
    setLoading(true);
    const data = await getDecklistsBySide(side);

    setLoading(false);
    if (data) {
      console.log(data);
      setIdToCardsMap(data.idToCardsMap);
      setPairwiseSimilarities(data.pairWiseSimilarities);
      setLoaded(true);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();

    const numFeatures = 4;
    const logisticModel = new OnlineLogisticRegression(
      0.01, // Learning rate
      (updatedModel) => {
        setWeights(updatedModel.weights); // Update weights in state
        setBias(updatedModel.bias); // Update bias in state
      }
    );
    setModel(logisticModel);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    getTwoRandomDecklists();
  }, [pairwiseSimilarities]);

  const getTwoRandomDecklists = () => {
    const similarities = pairwiseSimilarities.filter(
      (similarity) => similarity.sameIdentity
    );

    const randomSimilarity =
      similarities[Math.floor(Math.random() * similarities.length)];

    setPair(randomSimilarity);
  };

  function deckOverlapPerCard(
    deckA: Decklist,
    deckB: Decklist
  ): Record<string, number> {
    const deckAMap = new Map<string, number>();
    for (const card of deckA) {
      deckAMap.set(card.card_name, card.card_count);
    }

    const overlapMap: Record<string, number> = {};

    for (const card of deckB) {
      const countA = deckAMap.get(card.card_name);
      if (countA !== undefined) {
        overlapMap[card.card_name] = Math.min(countA, card.card_count);
      }
    }

    return overlapMap;
  }

  function deckDifferencePerCard(
    deckA: Decklist,
    deckB: Decklist
  ): Record<string, number> {
    const allCards = Array.from(
      new Set([
        ...deckA.map((card) => card.card_name),
        ...deckB.map((card) => card.card_name),
      ])
    );
    const deckAMap = new Map<string, number>();
    for (const card of deckA) {
      deckAMap.set(card.card_name, card.card_count);
    }
    const deckBMap = new Map<string, number>();
    for (const card of deckB) {
      deckBMap.set(card.card_name, card.card_count);
    }

    const differenceMap: Record<string, number> = {};
    for (const card of allCards) {
      const countA = deckAMap.get(card) ?? 0;
      const countB = deckBMap.get(card) ?? 0;
      differenceMap[card] = Math.abs(countA - countB);
    }
    return differenceMap;
  }

  function normalize(map: Record<string, number>): Record<string, number> {
    const sum = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.fromEntries(
      Object.entries(map).map(([key, value]) => [key, value / sum])
    );
  }

  const features = pair
    ? {
        ...normalize(
          deckDifferencePerCard(
            idToCardsMap[pair.decklist1],
            idToCardsMap[pair.decklist2]
          )
        ),
        cosine: pair.cosine,
        jaccard: pair.jaccard,
        weightedJaccard: pair.weightedJaccard,
        composition: pair.composition,
      }
    : {};

  const handleTrain = (same: boolean) => {
    if (!pair) return;
    console.log(features);

    model?.update(features, same ? 1 : 0);

    getTwoRandomDecklists();
  };

  if (!user) {
    return null;
  }

  const prediction = model?.predict(features);

  return (
    <Container pt="xl">
      <Stack align="start">
        <Title order={3}>Classifier</Title>

        <Title order={4}>Similarity checker</Title>
        <Button onClick={load} loading={loading}>
          Load all data
        </Button>

        {pair && (
          <Box>
            <List>
              <ListItem>Cosine: {pair.cosine.toFixed(4)}</ListItem>
              <ListItem>Jaccard: {pair.jaccard.toFixed(4)}</ListItem>
              <ListItem>
                Weighted Jaccard: {pair.weightedJaccard.toFixed(4)}
              </ListItem>
              <ListItem>Composition: {pair.composition.toFixed(4)}</ListItem>
            </List>
          </Box>
        )}

        {model && (
          <Box>
            <ScrollArea h="200">
              <pre>
                {JSON.stringify(
                  Object.entries(weights).sort(([k1, v1], [k2, v2]) => v2 - v1),
                  null,
                  2
                )}
              </pre>
            </ScrollArea>
            <Text>Bias: {bias}</Text>
            <Text>Prediction: {prediction}</Text>
          </Box>
        )}
        {pair && (
          <Group>
            <Button onClick={() => handleTrain(true)}>Same</Button>
            <Button onClick={() => handleTrain(false)}>Different</Button>
          </Group>
        )}
        <Group align="start">
          <Stack w="400">
            <Title order={5}>Decklist 1</Title>
            {pair?.decklist1 && (
              <>
                <Anchor href={getNrdbLink(pair.decklist1.toString())}>
                  {pair.decklist1}
                </Anchor>
                <DecklistDisplay decklist={idToCardsMap[pair.decklist1]} />
              </>
            )}
          </Stack>

          <Stack w="400">
            <Title order={5}>Decklist 2</Title>
            {pair?.decklist2 && (
              <>
                <Anchor href={getNrdbLink(pair.decklist2.toString())}>
                  {pair.decklist2}
                </Anchor>
                <DecklistDisplay decklist={idToCardsMap[pair.decklist2]} />
              </>
            )}
          </Stack>
        </Group>
      </Stack>
    </Container>
  );
}
