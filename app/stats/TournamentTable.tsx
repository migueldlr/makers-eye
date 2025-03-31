import { TournamentRow } from "@/lib/localtypes";
import { parseUrl } from "@/lib/util";
import {
  Anchor,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";

export default function TournamentTable({
  tournaments,
  isAdmin = false,
  tournamentIds,
}: {
  tournaments: TournamentRow[];
  isAdmin?: boolean;
  tournamentIds?: number[];
}) {
  if (tournaments.length === 0) {
    return <Text>No tournaments found</Text>;
  }
  if (!isAdmin)
    tournaments.sort((a, b) => {
      return new Date(b.date!).getTime() - new Date(a.date!).getTime();
    });

  const filteredTournaments = tournaments.filter((tournament) => {
    if (tournamentIds) {
      return tournamentIds.includes(tournament.id);
    }
    return true;
  });

  return (
    <Table>
      <TableThead pos="sticky" bg="dark.8">
        <TableTr>
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
        </TableTr>
      </TableThead>
      <TableTbody>
        {filteredTournaments.map((tournament) => {
          const parsedUrl = parseUrl(tournament.url ?? "");

          return (
            <TableTr key={tournament.id}>
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
            </TableTr>
          );
        })}
      </TableTbody>
    </Table>
  );
}
