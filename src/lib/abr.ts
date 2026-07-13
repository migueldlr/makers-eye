export type AbrEntry = {
  user_id: number;
  user_name: string | null;
  user_import_name: string | null;
  rank_swiss: number;
  rank_top: number | null;
  runner_deck_title: string;
  runner_deck_identity_id: string;
  runner_deck_url: string;
  corp_deck_title: string;
  corp_deck_identity_id: string;
  corp_deck_url: string;
  runner_deck_identity_title: string;
  runner_deck_identity_faction: string;
  corp_deck_identity_title: string;
  corp_deck_identity_faction: string;
};

export function getAbrDeckUrls(entry: AbrEntry | undefined) {
  const corp = entry?.corp_deck_url?.trim();
  const runner = entry?.runner_deck_url?.trim();
  return {
    corp: corp || null,
    runner: runner || null,
  };
}

export type AbrTournament = {
  id: number;
  title: string;
  date: string;
  end_date?: string | null;
  location?: string | null;
  players_count?: number | null;
  top_count?: number | null;
  url: string;
};

export type AbrTournamentSource = {
  name: string;
  date: string;
  city?: string | null;
  country?: string | null;
  playerCount?: number | null;
  cutSize?: number | null;
};

export type AbrTournamentDetection = {
  status: "matched" | "ambiguous" | "unmatched";
  tournament: AbrTournament | null;
  candidates: AbrTournament[];
};

function normalizeAbrText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeAbrDate(value: string | null | undefined): string | null {
  const match = value?.match(/^(\d{4})[.-](\d{2})[.-](\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function nextDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function apiDate(value: string): string {
  return value.replaceAll("-", ".");
}

function nameKey(source: AbrTournamentSource, title: string): string {
  const excluded = new Set(
    [source.city, source.country]
      .flatMap((value) => normalizeAbrText(value ?? "").split(" "))
      .filter(Boolean)
  );
  return normalizeAbrText(title)
    .split(" ")
    .filter((word) => word && !excluded.has(word))
    .sort()
    .join(" ");
}

function chooseUnique(
  candidates: AbrTournament[]
): AbrTournamentDetection | null {
  return candidates.length === 1
    ? { status: "matched", tournament: candidates[0], candidates }
    : null;
}

export function matchAbrTournamentCandidates(
  source: AbrTournamentSource,
  tournaments: AbrTournament[]
): AbrTournamentDetection {
  const sourceDate = normalizeAbrDate(source.date);
  if (!sourceDate) {
    return { status: "unmatched", tournament: null, candidates: [] };
  }

  const dateMatches = tournaments.filter((tournament) => {
    const start = normalizeAbrDate(tournament.date);
    const end = normalizeAbrDate(tournament.end_date) ?? start;
    return start != null && end != null && start <= sourceDate && sourceDate <= end;
  });
  if (dateMatches.length === 0) {
    return { status: "unmatched", tournament: null, candidates: [] };
  }

  const city = normalizeAbrText(source.city ?? "");
  const country = normalizeAbrText(source.country ?? "");
  const locationMatches = dateMatches.filter((tournament) => {
    const location = normalizeAbrText(tournament.location ?? "");
    return (!city || location.includes(city)) &&
      (!country || location.includes(country));
  });
  const candidates = locationMatches.length > 0 ? locationMatches : dateMatches;
  const sourceName = normalizeAbrText(source.name);
  const sourceNameKey = nameKey(source, source.name);
  const nameMatches = candidates.filter((tournament) => {
    const title = normalizeAbrText(tournament.title);
    return (
      title === sourceName ||
      (sourceNameKey !== "" && nameKey(source, tournament.title) === sourceNameKey)
    );
  });
  const uniqueName = chooseUnique(nameMatches);
  if (uniqueName) return uniqueName;

  const narrowed = nameMatches.length > 0 ? nameMatches : candidates;
  const hasCountEvidence = source.playerCount != null || source.cutSize != null;
  const countMatches = hasCountEvidence
    ? narrowed.filter(
        (tournament) =>
          (source.playerCount == null ||
            tournament.players_count === source.playerCount) &&
          (source.cutSize == null || tournament.top_count === source.cutSize)
      )
    : [];
  const uniqueCount = chooseUnique(countMatches);
  if (uniqueCount) return uniqueCount;

  const unresolved = countMatches.length > 0 ? countMatches : narrowed;
  return {
    status: unresolved.length > 1 ? "ambiguous" : "unmatched",
    tournament: null,
    candidates: unresolved,
  };
}

export async function detectAbrTournament(
  source: AbrTournamentSource
): Promise<AbrTournamentDetection> {
  const date = normalizeAbrDate(source.date);
  if (!date) {
    return { status: "unmatched", tournament: null, candidates: [] };
  }
  const params = new URLSearchParams({
    start: apiDate(date),
    end: apiDate(nextDate(date)),
  });
  const response = await fetch(
    `https://alwaysberunning.net/api/tournaments?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(`ABR returned ${response.status}.`);
  const tournaments = (await response.json()) as AbrTournament[];
  return matchAbrTournamentCandidates(source, tournaments);
}
