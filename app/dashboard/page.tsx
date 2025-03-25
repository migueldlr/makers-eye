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
  Chip,
  Code,
} from "@mantine/core";
import { signOut } from "../login/actions";
import { BackButton } from "@/components/BackButton";
import { useEffect, useState } from "react";
import { Tournament } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { normalizeUrl, parseUrl, URLS } from "@/lib/util";
import {
  doesTournamentExist,
  proxyFetch,
  uploadMatches,
  uploadStandings,
  uploadTournament,
} from "./actions";
import { tournamentToMatches, tournamentToStandings } from "@/lib/tournament";

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

function DataDisplay({
  data,
  isAesops,
}: {
  data: Tournament;
  isAesops: boolean;
}) {
  if (!data) return <Text>No data yet...</Text>;

  return (
    <Stack>
      <Group>
        <Text>Loaded tournament:</Text>
        <Code>{data.name}</Code>
      </Group>
    </Stack>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Tournament>();
  const [user, setUser] = useState<User>();
  const [site, setSite] = useState("");
  const supabase = createClient();
  const [url, setUrl] = useState("");

  useEffect(() => {
    (async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        redirect("/login");
      }
      setUser(authData.user);
    })();
  }, []);

  async function load(url: string) {
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
    const tournamentId = await uploadTournament(data, normalizeUrl(url));

    const standings = await uploadStandings(
      tournamentId,
      tournamentToStandings(data, site === "aesops")
    );

    const matches = await uploadMatches(
      tournamentId,
      tournamentToMatches(data, site === "aesops", standings)
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container mt="lg">
      <Stack>
        Hello {user!.email}
        <Stack align="start">
          <TextInput value={url} onChange={(e) => setUrl(e.target.value)} />
          <DataDisplay data={data!} isAesops={site === "aesops"} />
          <VerificationChip tournament={data!} />
          <Button onClick={() => load(url)}>Load</Button>
          {data && <Button onClick={() => submitTournament()}>Upload</Button>}
        </Stack>
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
