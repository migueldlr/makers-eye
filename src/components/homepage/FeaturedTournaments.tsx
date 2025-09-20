import { Anchor, Flex, Stack } from "@mantine/core";
import { IconPointFilled } from "@tabler/icons-react";
import { isAfter, parseISO, subDays } from "date-fns";

const featuredTournaments = [
  {
    name: "Americas Online",
    href: "/cobra/4171",
    date: "2025-09-06",
  },
];

export default function FeaturedTournaments() {
  const activeTournaments = featuredTournaments.filter((tournament) => {
    return isAfter(parseISO(tournament.date), subDays(new Date(), 7));
  });
  if (activeTournaments.length === 0) return null;
  return (
    <Stack align="center">
      <Flex gap="xs">
        {activeTournaments.map((tournament, i) => {
          return (
            <Flex key={tournament.href} gap="xs">
              <Anchor href={tournament.href} key={tournament.href} c="orange">
                {tournament.name}
              </Anchor>
              {i < featuredTournaments.length - 1 && (
                <Flex align="center" key={i}>
                  <IconPointFilled size={12} color="orange" />
                </Flex>
              )}
            </Flex>
          );
        })}
      </Flex>
    </Stack>
  );
}
