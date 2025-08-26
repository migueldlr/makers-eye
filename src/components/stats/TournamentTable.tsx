"use client";

import { TournamentRow } from "@/lib/localtypes";
import {
  DEFAULT_FORMAT,
  DEFAULT_META,
  EXCLUDE_FILTER_KEY,
  parseUrl,
} from "@/lib/util";
import {
  Anchor,
  Checkbox,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function TournamentTable({
  tournaments,
  isAdmin = false,
  tournamentIds,
  meta = DEFAULT_META,
  cardpool = DEFAULT_FORMAT,
  excludeIds,
}: {
  tournaments: TournamentRow[];
  isAdmin?: boolean;
  tournamentIds?: number[];
  meta?: string;
  cardpool?: string;
  excludeIds?: number[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const setExcludeIds = (ids: number[]) => {
    const entries = Object.fromEntries(params.entries());

    if (ids.length === 0) {
      delete entries[EXCLUDE_FILTER_KEY];
    } else {
      entries[EXCLUDE_FILTER_KEY] = ids.join(",");
    }

    const newParams = new URLSearchParams(entries);

    router.push(`/stats?${newParams.toString()}`);
  };

  if (tournaments.length === 0) {
    return <Text>No tournaments found</Text>;
  }
  if (!isAdmin)
    tournaments.sort((a, b) => {
      return new Date(b.date!).getTime() - new Date(a.date!).getTime();
    });

  const filteredTournaments = tournaments.filter((tournament) => {
    if (tournamentIds && !tournamentIds.includes(tournament.id)) {
      return false;
    }
    if (tournament.meta !== meta && !isAdmin) {
      return false;
    }
    if (tournament.cardpool !== cardpool && !isAdmin) {
      return false;
    }
    return true;
  });

  return (
    <Table>
      <TableThead pos="sticky" bg="dark.8">
        <TableTr>
          <TableTh>Included</TableTh>
          <TableTh>Name</TableTh>
          {isAdmin && <TableTh>ID</TableTh>}
          <TableTh>Date</TableTh>
          <TableTh>Meta</TableTh>
          <TableTh>Region</TableTh>
          <TableTh>Location</TableTh>
          <TableTh>Players</TableTh>
          <TableTh>Format</TableTh>
          <TableTh>URL</TableTh>
          <TableTh>The Maker&#39;s Eye</TableTh>
          {isAdmin && <TableTh>Last updated</TableTh>}
          {isAdmin && <TableTh>ABR URL</TableTh>}
        </TableTr>
      </TableThead>
      <TableTbody>
        {filteredTournaments.map((tournament) => {
          const parsedUrl = parseUrl(tournament.url ?? "");

          return (
            <TableTr key={tournament.id}>
              <TableTd>
                <Checkbox
                  checked={!excludeIds?.includes(tournament.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked) {
                      setExcludeIds([...(excludeIds ?? []), tournament.id]);
                    } else {
                      setExcludeIds(
                        (excludeIds ?? []).filter((id) => id !== tournament.id)
                      );
                    }
                  }}
                />
              </TableTd>
              <TableTd>{tournament.name}</TableTd>
              {isAdmin && <TableTd>{tournament.id}</TableTd>}
              <TableTd>{tournament.date}</TableTd>
              <TableTd>{tournament.meta}</TableTd>
              <TableTd>{tournament.region}</TableTd>
              <TableTd>{tournament.location}</TableTd>
              <TableTd>{tournament.player_count}</TableTd>
              <TableTd>{tournament.format?.toUpperCase()}</TableTd>
              <TableTd>
                <Anchor href={tournament.url ?? "#"} target="_blank">
                  {parsedUrl?.[0]} {parsedUrl?.[1]}
                </Anchor>
              </TableTd>
              <TableTd>
                <Anchor
                  href={`/${parsedUrl?.[0]}/${parsedUrl?.[1]}`}
                  target="_blank"
                >
                  Link
                </Anchor>
              </TableTd>
              {isAdmin && <TableTd>{tournament.last_modified_at}</TableTd>}
              {isAdmin && (
                <TableTd>
                  {tournament.abr_url ? (
                    <Anchor href={tournament.abr_url} target="_blank">
                      Link
                    </Anchor>
                  ) : (
                    "N/A"
                  )}
                </TableTd>
              )}
            </TableTr>
          );
        })}
      </TableTbody>
    </Table>
  );
}
