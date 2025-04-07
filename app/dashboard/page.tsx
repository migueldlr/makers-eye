"use client";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  Container,
  Group,
  Stack,
  TextInput,
  Text,
  useCombobox,
  Title,
  Switch,
  Radio,
  Code,
  Box,
} from "@mantine/core";
import { signOut } from "../login/actions";
import { BackButton } from "@/components/common/BackButton";
import { useEffect, useState } from "react";
import { Tournament } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import {
  DEFAULT_META,
  LOCATION_OPTIONS,
  normalizeUrl,
  parseUrl,
  REGION_OPTIONS,
  URLS,
} from "@/lib/util";
import {
  doesTournamentExist,
  getTournaments,
  proxyFetch,
  uploadMatches,
  uploadStandings,
  uploadTournament,
} from "./actions";
import { tournamentToMatches, tournamentToStandings } from "@/lib/tournament";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Database } from "@/lib/supabase";
import TournamentTable from "../../components/stats/TournamentTable";
import { TournamentRow } from "@/lib/localtypes";
import DecklistStats from "@/components/stats/DecklistStats";
import {
  getDecklist,
  refreshAllArchetypes,
  uploadAllCards,
  uploadAllDecklists,
  uploadDecklist,
} from "../stats/actions";

function VerificationChip({ tournament }: { tournament: Tournament }) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournament == null) return;
    (async () => {
      if (tournament.name == null) return;
      setVerified(true);
      setLoading(true);

      const doesTournamentNameExist = await doesTournamentExist(
        tournament.name
      );
      setLoading(false);

      if (doesTournamentNameExist) {
        setVerified(false);
      }
    })();
  }, [tournament]);

  if (!tournament) return null;

  if (loading) {
    return <Text>Verifying...</Text>;
  }
  if (verified) {
    return null;
  }

  return (
    <Text c="red">
      Conflict: {`Tournament with name "${tournament.name}" already exists`}
    </Text>
  );
}

function UrlInput({
  url,
  setUrl,
}: {
  url: string;
  setUrl: (url: string) => void;
}) {
  const [useShortcode, setUseShortcode] = useState(false);
  const [site, setSite] = useState("");
  const [shortValue, setShortValue] = useState("");

  useEffect(() => {
    if (!useShortcode) return;
    if (site === "") return;
    setUrl(`${URLS[site as keyof typeof URLS]}${shortValue}`);
  }, [site, shortValue, useShortcode, setUrl]);
  const shortInput = (
    <Group>
      <Radio.Group value={site} onChange={setSite} name="Site?">
        <Stack>
          <Radio value="aesops" label="Aesops" />
          <Radio value="cobra" label="Cobra" />
        </Stack>
      </Radio.Group>
      <TextInput
        value={shortValue}
        onChange={(e) => setShortValue(e.target.value)}
      />
    </Group>
  );
  const longInput = (
    <TextInput value={url} onChange={(e) => setUrl(e.target.value)} w="50vw" />
  );

  return (
    <Group>
      {useShortcode ? shortInput : longInput}
      <Switch
        checked={useShortcode}
        onChange={(e) => setUseShortcode(e.currentTarget.checked)}
        label="Use shortcode"
      />
    </Group>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Tournament>();
  const [user, setUser] = useState<User>();
  const [site, setSite] = useState("");
  const supabase = createClient();
  const [url, setUrl] = useState("");

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [region, setRegion] = useState<string | null>(null);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [location, setLocation] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [sortBy, setSortBy] = useState<string>("last_updated_at");

  const [decklistId, setDecklistId] = useState<string>("");

  useEffect(() => {
    setData(undefined);
    setSuccess(false);
  }, [url]);

  useEffect(() => {
    (async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        redirect("/login");
      }
      setUser(authData.user);
    })();
  }, [supabase.auth]);

  useEffect(() => {
    if (!uploadLoading) {
      (async () => {
        const tournaments = await getTournaments();
        setTournaments(tournaments);
      })();
    }
  }, [uploadLoading]);

  async function load(url: string) {
    setData(undefined);
    setRegion(null);
    setLocation(null);
    setMeta(DEFAULT_META);
    const parsed = parseUrl(url);
    if (!parsed) {
      return;
    }
    const [site, id] = parsed;
    setSite(site);

    const tournament = (await proxyFetch(
      `${URLS[site as keyof typeof URLS]}${id}.json`
    )) as unknown as Tournament;

    setData(tournament);
  }

  async function submitTournament() {
    if (!data || !url) {
      return;
    }
    setUploadLoading(true);
    const tournamentId = await uploadTournament(
      data,
      normalizeUrl(url),
      meta,
      region,
      location
    );

    const standings = await uploadStandings(
      tournamentId,
      tournamentToStandings(data, site === "aesops")
    );

    const matches = await uploadMatches(
      tournamentId,
      tournamentToMatches(data, site === "aesops", standings)
    );

    setUploadLoading(false);
  }

  const loadDecklist = async () => {
    if (!decklistId) return;
    const data = await uploadDecklist({ decklistId: Number(decklistId) });

    console.log(data);
    console.log(JSON.stringify(data).length);
  };

  const refreshDecklists = async () => {
    await uploadAllDecklists();
  };

  const loadAllCards = async () => {
    await uploadAllCards();
  };

  const refreshArchetypes = async () => {
    await refreshAllArchetypes();
  };

  if (!user) {
    return null;
  }

  const additionalData = (
    <>
      <Text>
        Found tournament <Code>{data?.name}</Code> held on{" "}
        <Code>{data?.date}</Code>
      </Text>
      <Group>
        <SearchableSelect
          label="Location"
          placeholder="Online?"
          options={LOCATION_OPTIONS}
          value={location}
          setValue={setLocation}
        />
        <SearchableSelect
          label="Region"
          placeholder="Select a region"
          options={REGION_OPTIONS}
          value={region}
          setValue={setRegion}
        />
        <TextInput value={meta} label="Meta" readOnly />
      </Group>
    </>
  );

  if (sortBy === "last_updated_at") {
    tournaments.sort((a, b) => {
      return (
        new Date(a.last_modified_at ?? 0).getTime() -
        new Date(b.last_modified_at ?? 0).getTime()
      );
    });
  }

  return (
    <Container mt="lg">
      <Stack>
        <Title order={3}>Upload</Title>
        <Stack align="start">
          <UrlInput url={url} setUrl={setUrl} />
          <VerificationChip tournament={data!} />
          {!data && <Button onClick={() => load(url)}>Load</Button>}
          {data && additionalData}
          {data && (
            <Button
              onClick={() => submitTournament()}
              variant="gradient"
              gradient={{ from: "red", to: "yellow", deg: 30 }}
              loading={uploadLoading}
            >
              Upload
            </Button>
          )}
        </Stack>
        <Title order={3} mt="xl">
          Decklist stats
        </Title>
        <DecklistStats tournaments={tournaments} />

        <Title order={3} mt="xl">
          Decklist import
        </Title>
        <Group align="end">
          <TextInput
            label="Decklist ID"
            value={decklistId}
            onChange={(e) => setDecklistId(e.target.value)}
          />
          <Button onClick={() => loadDecklist()}>Load</Button>
        </Group>
        <Group>
          <Button onClick={() => refreshDecklists()}>
            Refresh all decklists
          </Button>
          <Button onClick={() => loadAllCards()}>Load all cards</Button>
          <Button onClick={() => refreshArchetypes()}>
            Refresh archetypes
          </Button>
        </Group>

        <Title order={3} mt="xl">
          Uploaded
        </Title>
        <TournamentTable tournaments={tournaments} isAdmin />
        <Group mt="xl">
          <BackButton />
          <Button variant="subtle" onClick={signOut}>
            Sign out
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
