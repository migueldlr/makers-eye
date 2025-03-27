import { Database } from "@/lib/supabase";
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
}: {
  tournaments: Database["public"]["Tables"]["tournaments"]["Row"][];
}) {
  if (tournaments.length === 0) {
    return <Text>No tournaments found</Text>;
  }
  tournaments.sort((a, b) => {
    return new Date(b.date!).getTime() - new Date(a.date!).getTime();
  });

  return (
    <Table>
      <TableThead pos="sticky" bg="dark.8">
        <TableTr>
          <TableTh>Name</TableTh>
          <TableTh>Date</TableTh>
          <TableTh>Meta</TableTh>
          <TableTh>Region</TableTh>
          <TableTh>Location</TableTh>
          <TableTh>URL</TableTh>
          <TableTh>The Maker&#39;s Eye</TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>
        {tournaments.map((tournament) => {
          const parsedUrl = parseUrl(tournament.url ?? "");

          return (
            <TableTr key={tournament.id}>
              <TableTd>{tournament.name}</TableTd>
              <TableTd>{tournament.date}</TableTd>
              <TableTd>{tournament.meta}</TableTd>
              <TableTd>{tournament.region}</TableTd>
              <TableTd>{tournament.location}</TableTd>
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
            </TableTr>
          );
        })}
      </TableTbody>
    </Table>
  );
}
