"use client";

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Group,
  List,
  ListItem,
  ScrollArea,
  Select,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getDecklistsBySide } from "../classifier/actions";
import useAuth from "@/hooks/useAuth";
import { Decklist, getNrdbLink, SimilarityData } from "../classifier/page";
import { sortDecklist } from "@/components/classifier/DecklistDisplay";
import { IconCheck, IconUpload } from "@tabler/icons-react";
import { getArchetypes, uploadArchetype } from "./actions";
import { CORP_ARCHETYPES, RUNNER_ARCHETYPES } from "@/lib/archetypes";
import { shortenId } from "@/lib/util";

type ArchetypeData = {
  archetype: string | null;
  id: number;
};

function getIdentity(decklist: Decklist) {
  const identity = decklist.find(
    (card) => card.card_type === "identity"
  )?.card_name;
  if (!identity) {
    return null;
  }
  return identity;
}

function getCardTypeDistribution(decklist: Decklist) {
  return decklist.reduce((acc, card) => {
    acc[card.card_type] = (acc[card.card_type] || 0) + card.card_count;
    return acc;
  }, {} as { [key: string]: number });
}

function evalRule(decklist: Decklist, rule: string) {
  const ruleParts = rule.split(/[^A-Za-z0-9]/);
  const left = ruleParts[0];
  const right = Number(ruleParts[1]);
  const operator = rule.match(/[^A-Za-z0-9]/)?.[0];

  const distribution = getCardTypeDistribution(decklist);

  if (left === "total") {
    const total = decklist.reduce((acc, card) => acc + card.card_count, 0);

    if (operator === "<") {
      return total < right;
    } else if (operator === ">") {
      return total > right;
    } else if (operator === "=") {
      return total === right;
    }
  }

  if (operator === "<") {
    return distribution[left] < right;
  } else if (operator === ">") {
    return distribution[left] > right;
  } else if (operator === "=") {
    return distribution[left] === right;
  }

  return false;
}

function getArchetype(decklist: Decklist, side: string) {
  const identity = getIdentity(decklist);
  if (!identity) {
    return "Unknown";
  }

  const archetypes =
    side === "corp"
      ? CORP_ARCHETYPES[shortenId(identity) as keyof typeof CORP_ARCHETYPES]
      : RUNNER_ARCHETYPES[
          shortenId(identity) as keyof typeof RUNNER_ARCHETYPES
        ];

  if (!archetypes) {
    return "Unknown";
  }

  if (typeof archetypes === "string") {
    return archetypes;
  }

  for (const archetype of archetypes) {
    if (typeof archetype === "string") {
      return archetype;
    }
    let found = true;
    for (const archetypeCard of archetype.slice(0, archetype.length - 1)) {
      if (archetypeCard.match(/[<>=]/)) {
        if (!evalRule(decklist, archetypeCard)) {
          found = false;
          break;
        }
      } else if (!decklist.some((card) => card.card_name === archetypeCard)) {
        found = false;
        break;
      }
    }
    if (found) {
      return archetype[archetype.length - 1];
    }
  }

  return "Unknown";
}

function groupDecklistsByIdentity(idToCardsMap: { [key: number]: Decklist }) {
  const groupedDecklists: Record<string, { id: string; decklist: Decklist }[]> =
    {};

  for (const [decklistId, decklist] of Object.entries(idToCardsMap)) {
    const identity = decklist.find(
      (card) => card.card_type === "identity"
    )?.card_name;

    if (!identity) {
      continue;
    }
    if (!groupedDecklists[identity]) {
      groupedDecklists[identity] = [];
    }
    groupedDecklists[identity].push({
      id: decklistId,
      decklist,
    });
  }

  return groupedDecklists;
}

function DecklistEntry({
  decklist,
  id,
  archetypes,
  calculatedArchetype,
}: {
  decklist: Decklist;
  id: string;
  archetypes: ArchetypeData[];
  calculatedArchetype: string;
}) {
  const initialArchetype = archetypes.find(
    (a) => a.id === Number(id)
  )?.archetype;
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(initialArchetype ? true : false);

  const list = sortDecklist(decklist);

  const upload = async () => {
    setUploading(true);
    setUploaded(false);

    // await uploadArchetype(archetype, Number(id));

    setUploading(false);
    setUploaded(true);
  };

  return (
    <Stack gap="xs" style={{ minWidth: "350px" }}>
      <Group wrap="nowrap" gap="xs">
        <Anchor
          href={getNrdbLink(id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {id}
        </Anchor>
        <Text>{calculatedArchetype}</Text>
        {calculatedArchetype === "Unknown" && <Badge color="red">?</Badge>}
        {/* <TextInput
          value={calculatedArchetype}
            onChange={(e) => {
              setArchetype(e.target.value);
              setUploaded(false);
            }}
        /> */}
        {/* {archetype && (
          <ActionIcon
            onClick={upload}
            size="lg"
            variant="subtle"
            loading={uploading}
          >
            {uploaded ? (
              <IconCheck style={{ width: "70%", height: "70%" }} />
            ) : (
              <IconUpload style={{ width: "70%", height: "70%" }} />
            )}
          </ActionIcon>
        )} */}
      </Group>
      <List>
        {list.map((card) => (
          <ListItem key={card.card_name}>{card.card_name}</ListItem>
        ))}
      </List>
    </Stack>
  );
}

export default function Page() {
  const user = useAuth();
  const side = "corp";

  const [idToCardsMap, setIdToCardsMap] = useState<{
    [key: number]: Decklist;
  }>({});
  const [pairwiseSimilarities, setPairwiseSimilarities] = useState<
    SimilarityData[]
  >([]);
  const [groupedDecklists, setGroupedDecklists] = useState<{
    [id: string]: { id: string; decklist: Decklist }[];
  }>({});

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [selectedIdentity, setSelectedIdentity] = useState<string | null>("");
  const [archetypes, setArchetypes] = useState<ArchetypeData[]>([]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedIdentity) {
        return;
      }
      const ids = groupedDecklists[selectedIdentity].map((deck) =>
        Number(deck.id)
      );
      const data: ArchetypeData[] = await getArchetypes(ids);

      setArchetypes(data);
    })();
  }, [selectedIdentity]);

  const load = async () => {
    const localStorageKey = `${side}-decklists`;
    const localData = localStorage.getItem(localStorageKey);
    if (localData) {
      const parsedData = JSON.parse(localData);

      setIdToCardsMap(parsedData.idToCardsMap);
      setPairwiseSimilarities(parsedData.pairWiseSimilarities);
      setGroupedDecklists(groupDecklistsByIdentity(parsedData.idToCardsMap));
      setLoading(false);
      setLoaded(true);
      console.log("loaded from local storage");
      return;
    }

    setLoading(true);
    const data = await getDecklistsBySide(side);
    console.log("loaded from server");

    setLoading(false);
    if (data) {
      setIdToCardsMap(data.idToCardsMap);
      setPairwiseSimilarities(data.pairWiseSimilarities);
      setGroupedDecklists(groupDecklistsByIdentity(data.idToCardsMap));
      setLoading(false);
      setLoaded(true);

      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          idToCardsMap: data.idToCardsMap,
          pairWiseSimilarities: data.pairWiseSimilarities,
        })
      );
    }
  };

  if (!user) {
    return null;
  }

  const status = Object.entries(groupedDecklists).map(
    ([identity, decklists]) => {
      return {
        identity: identity,
        results: decklists.map(({ id, decklist }) => {
          const archetype = getArchetype(decklist, side);

          return archetype !== "Unknown";
        }),
      };
    }
  );

  status.sort((a, b) => b.results.length - a.results.length);

  return (
    <Container pt="xl">
      <Title order={3}>Classifier v2</Title>

      <Select
        label="Select Identity"
        data={Object.keys(groupedDecklists)}
        value={selectedIdentity}
        onChange={setSelectedIdentity}
      />

      <List>
        {status.map(({ identity, results }) => {
          return (
            <ListItem
              key={identity}
              onClick={() => {
                setSelectedIdentity(identity);
              }}
            >
              <Group gap="xs">
                <Text>{shortenId(identity)}</Text>
                <Badge
                  color={results.every((result) => result) ? "green" : "red"}
                >
                  {results.filter((result) => result).length} / {results.length}
                </Badge>
              </Group>
            </ListItem>
          );
        })}
      </List>

      {selectedIdentity && archetypes.length > 0 && (
        <Box>
          <Title order={4}>
            {groupedDecklists[selectedIdentity].length} decklists for{" "}
            {selectedIdentity}
          </Title>
          <Space h="md" />
          <ScrollArea>
            <Group align="start" wrap="nowrap" gap="md">
              {groupedDecklists[selectedIdentity]
                .sort((a, b) => {
                  const aArchetype = getArchetype(a.decklist, side);
                  const bArchetype = getArchetype(b.decklist, side);
                  return aArchetype.localeCompare(bArchetype);
                })
                .map((decklist) => {
                  const calculatedArchetype = getArchetype(
                    decklist.decklist,
                    side
                  );
                  return (
                    <DecklistEntry
                      key={decklist.id}
                      decklist={decklist.decklist}
                      id={decklist.id}
                      archetypes={archetypes}
                      calculatedArchetype={calculatedArchetype}
                    />
                  );
                })}
            </Group>
          </ScrollArea>
        </Box>
      )}
    </Container>
  );
}
