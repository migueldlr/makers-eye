import { Tournament } from "@/lib/types";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { isBefore, subDays } from "date-fns";

function checkIfConcluded(tournament: Tournament) {
  const { eliminationPlayers } = tournament;
  if (eliminationPlayers == null) return false;

  const maxSeed = Math.max(...eliminationPlayers.map((p) => p.seed ?? 0));

  const anyMissingEliminationPlayers = eliminationPlayers.some(
    (p) => p.id == null
  );

  return maxSeed > eliminationPlayers.length || anyMissingEliminationPlayers;
}

export default function TournamentNotConcludedAlert({
  tournament,
}: {
  tournament: Tournament;
}) {
  const mightNotBeConcluded = checkIfConcluded(tournament);

  const pastTournamentDate = tournament?.date
    ? isBefore(tournament.date, subDays(new Date(), 2))
    : false;

  if (!(mightNotBeConcluded && pastTournamentDate)) {
    return null;
  }

  return (
    <Alert color="yellow" icon={<IconAlertCircle />} variant="light">
      This tournament might not have full results. If you know the TO, maybe
      give them a nudge 🙂
    </Alert>
  );
}
