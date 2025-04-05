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
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import useAuth from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { getCardList, getDecklistsBySide, getSimilarity } from "./actions";
import DecklistDisplay from "@/components/classifier/DecklistDisplay";
import { OnlineLogisticRegression } from "./logreg";

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
  const [weights, setWeights] = useState<number[]>([]);
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
    setWeights(Array(numFeatures).fill(0));
    const logisticModel = new OnlineLogisticRegression(
      numFeatures, // Number of features
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

  const handleTrain = (same: boolean) => {
    if (!pair) return;
    const features = [
      pair.cosine,
      pair.jaccard,
      pair.weightedJaccard,
      pair.composition,
    ];

    model?.train(features, same ? 1 : 0);

    getTwoRandomDecklists();
  };

  if (!user) {
    return null;
  }

  const prediction = model?.predict(weights);

  function getDifferenceBetweenDecklists() {
    if (!pair) return [];
    const decklist1 = idToCardsMap[pair.decklist1];
    const decklist2 = idToCardsMap[pair.decklist2];

    const decklist1Cards = decklist1.map((card) => card.card_name);
    const decklist2Cards = decklist2.map((card) => card.card_name);

    const decklist1CardsSet = new Set(decklist1Cards);
    const decklist2CardsSet = new Set(decklist2Cards);

    const decklist1Only = decklist1Cards.filter(
      (card) => !decklist2CardsSet.has(card)
    );
    const decklist2Only = decklist2Cards.filter(
      (card) => !decklist1CardsSet.has(card)
    );

    const commonCards = decklist1Cards.filter((card) =>
      decklist2Cards.includes(card)
    );

    const commonCadsSet = new Set(commonCards);

    return [decklist1Only, decklist2Only, commonCards];
  }

  const difference = getDifferenceBetweenDecklists();

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
            <Text>Weights: {weights.join(", ")}</Text>
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
            {difference[0].join(", ")}
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
            {difference[1].join(", ")}
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
