"use client";

import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Container,
  Group,
  List,
  ListItem,
  Select,
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
import { CORP_ARCHETYPES } from "@/lib/archetypes";
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

function getArchetype(decklist: Decklist) {
  const identity = getIdentity(decklist);
  if (!identity) {
    return "Unknown";
  }

  const archetypes =
    CORP_ARCHETYPES[shortenId(identity) as keyof typeof CORP_ARCHETYPES];

  if (!archetypes) {
    return "Unknown";
  }

  for (const archetype of archetypes) {
    if (decklist.some((card) => card.card_name === archetype[0])) {
      return archetype[1];
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

  const [archetype, setArchetype] = useState(
    archetypes.find((a) => a.id === Number(id))?.archetype ??
      calculatedArchetype ??
      ""
  );

  const upload = async () => {
    setUploading(true);
    setUploaded(false);

    await uploadArchetype(archetype, Number(id));

    setUploading(false);
    setUploaded(true);
  };

  return (
    <ListItem key={id}>
      <Group>
        <Anchor
          href={getNrdbLink(id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {id}
        </Anchor>
        <TextInput
          value={archetype}
          onChange={(e) => {
            setArchetype(e.target.value);
            setUploaded(false);
          }}
        />
        {archetype && (
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
        )}
      </Group>
      <List withPadding>
        {list.map((card) => (
          <ListItem key={card.card_name}>{card.card_name}</ListItem>
        ))}
      </List>
    </ListItem>
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
    const localData = localStorage.getItem("decklists");
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

    setLoading(false);
    if (data) {
      setIdToCardsMap(data.idToCardsMap);
      setPairwiseSimilarities(data.pairWiseSimilarities);
      setLoaded(true);

      localStorage.setItem(
        "decklists",
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

  return (
    <Container pt="xl">
      <Title order={3}>Classifier v2</Title>

      <Select
        label="Select Identity"
        data={Object.keys(groupedDecklists)}
        value={selectedIdentity}
        onChange={setSelectedIdentity}
      />

      {selectedIdentity && archetypes.length > 0 && (
        <Box>
          <Title order={4}>
            {groupedDecklists[selectedIdentity].length} decklists for{" "}
            {selectedIdentity}
          </Title>
          <List>
            {groupedDecklists[selectedIdentity].map((decklist) => {
              const calculatedArchetype = getArchetype(decklist.decklist);
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
          </List>
        </Box>
      )}
    </Container>
  );
}
