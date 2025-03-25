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
} from "@mantine/core";
import { signOut } from "../login/actions";
import { BackButton } from "@/components/BackButton";
import { useEffect, useState } from "react";
import { Tournament } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { normalizeUrl, parseUrl, URLS } from "@/lib/util";
import { proxyFetch, uploadStandings, uploadTournament } from "./actions";
import { tournamentToStandings } from "@/lib/tournament";

function DataDisplay({
  data,
  isAesops,
}: {
  data: Tournament;
  isAesops: boolean;
}) {
  if (!data) return <Text>No data yet...</Text>;

  console.log(tournamentToStandings(data, isAesops));
  return (
    <Stack>
      <Text>Loaded!</Text>
      <Text>{data.name}</Text>
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

  console.log(data);
  if (data) {
    console.log();
  }

  async function submitTournament() {
    if (!data || !url) {
      return;
    }
    const tournamentId = await uploadTournament(data, normalizeUrl(url));

    await uploadStandings(
      tournamentId,
      tournamentToStandings(data, site === "aesops")
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
          <Button onClick={() => load(url)}>Load</Button>
          {data && <Button onClick={() => submitTournament()}>Upload</Button>}
        </Stack>
        <DataDisplay data={data!} isAesops={site === "aesops"} />
        <Group mt="xl">
          <Button variant="subtle" onClick={signOut}>
            Sign out
          </Button>
        </Group>
        <BackButton />
      </Stack>
    </Container>
  );
}
