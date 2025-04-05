"use client";

import { updateAbrUrls } from "@/app/stats/actions";
import { TournamentRow } from "@/lib/localtypes";
import { Box, Button, Group } from "@mantine/core";
import { useCallback, useState } from "react";

const UPLOAD_PARTIAL = false;

export default function DecklistStats({
  tournaments,
}: {
  tournaments: TournamentRow[];
}) {
  const [data, setData] = useState<
    { url: string; name: string | null; id: number; entries: AbrEntry[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(0);
  const [totalUpload, setTotalUpload] = useState(0);

  const load = async () => {
    setLoading(true);
    const out = await Promise.all(
      (UPLOAD_PARTIAL ? tournaments.slice(0, 1) : tournaments)
        .filter((t) => t.id === 73)
        .map(async (t) => {
          const url = new URL(t.abr_url ?? "");
          const abrId = url.pathname.split("/")[2];
          const abrApiUrl = `https://alwaysberunning.net/api/entries?id=${abrId}`;

          const res = await fetch(abrApiUrl);
          const json: AbrEntry[] = await res.json();
          return {
            url: abrApiUrl,
            name: t.name,
            id: t.id,
            entries: json,
          };
        })
    );

    setTotalUpload(
      out
        .flatMap(({ entries }) => entries)
        .filter((entry) => entry.corp_deck_url && entry.runner_deck_url).length
    );

    setLoading(false);
    setData(out);
  };

  const process = async () => {
    console.log("processing");
    setUploading(true);

    setIndexLoaded(0);

    await Promise.all(
      data.flatMap(({ url, entries, name: tournamentName, id }) => {
        return entries.map(async (entry) => {
          if (!entry.corp_deck_url || !entry.runner_deck_url) {
            return;
          }

          const name = entry.user_import_name ?? entry.user_name ?? "";

          if (name == "") {
            console.log("no name", entry);
            return;
          }

          const runnerDeckId = Number(
            new URL(entry.runner_deck_url).pathname.split("/").slice(-1)[0]
          );

          const corpDeckId = Number(
            new URL(entry.corp_deck_url).pathname.split("/").slice(-1)[0]
          );

          const res = await updateAbrUrls({
            runnerDeckId,
            corpDeckId,
            tournamentId: id,
            name,
          });

          console.log(res);
          if (res.length == 0) {
            console.log("not updated", entry, tournamentName);
          }
          setIndexLoaded((prev) => prev + 1);
          return res;
        });
      })
    );
    setUploading(false);
  };

  return (
    <Group>
      <Button onClick={load} loading={loading}>
        DecklistStats
      </Button>

      <Button
        onClick={() => {
          setUploading(true);
          process();
        }}
        loading={uploading}
      >
        Process
      </Button>
      {uploading && (
        <Box>
          {indexLoaded} / {totalUpload}
        </Box>
      )}
    </Group>
  );
}
