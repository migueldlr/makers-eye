"use client";

import { BackButton } from "@/components/common/BackButton";
import {
  buildFavoriteIdentity,
  buildHighlights,
  buildUserRoleRecord,
  buildWinLossReasons,
  findBusiestDay,
  findLongestDurationGame,
  findLongestDrought,
  findLongestGame,
  findLongestStreak,
  findMostFrequentOpponent,
  getDateRange,
} from "@/lib/wrapped/processing";
import type {
  AggregateStats,
  DayActivityStat,
  FrequentOpponent,
  GameHighlight,
  IdentityFavorite,
  Highlights,
  LongestDurationGame,
  LongestDrought,
  LongestGame,
  LongestStreak,
  ReasonSummary,
  RoleRecord,
  UploadSummary,
  WinLossReasons,
} from "@/lib/wrapped/types";
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { type ReactNode, useMemo } from "react";

interface WrappedStatsProps {
  summary: UploadSummary;
  fileName: string | null;
  filterRange: { start: Date; end: Date } | null;
  onReset: () => void;
}

export default function WrappedStats({
  summary,
  fileName,
  filterRange,
  onReset,
}: WrappedStatsProps) {
  const profile = summary.profile;
  const aggregates = summary.aggregates;
  const { start, end } = useMemo(
    () => getDateRange(summary.games),
    [summary.games]
  );
  const runnerRecord = useMemo(() => {
    if (!profile) return null;
    return buildUserRoleRecord(summary.games, profile.username, "runner");
  }, [profile, summary.games]);
  const corpRecord = useMemo(() => {
    if (!profile) return null;
    return buildUserRoleRecord(summary.games, profile.username, "corp");
  }, [profile, summary.games]);

  const totalGames = summary.games.length;
  const favoriteRunner = useMemo(() => {
    if (!profile) return null;
    return buildFavoriteIdentity(summary.games, profile.username, "runner");
  }, [profile, summary.games]);
  const favoriteCorp = useMemo(() => {
    if (!profile) return null;
    return buildFavoriteIdentity(summary.games, profile.username, "corp");
  }, [profile, summary.games]);
  const longestGame = useMemo(() => {
    if (!profile) return null;
    return findLongestGame(summary.games, profile.username);
  }, [profile, summary.games]);
  const frequentOpponent = useMemo(() => {
    if (!profile) return null;
    return findMostFrequentOpponent(summary.games, profile.username);
  }, [profile, summary.games]);
  const longestDuration = useMemo(() => {
    if (!profile) return null;
    return findLongestDurationGame(summary.games, profile.username);
  }, [profile, summary.games]);
  const longestStreak = useMemo(() => {
    if (!profile) return null;
    return findLongestStreak(summary.games, profile.username);
  }, [profile, summary.games]);
  const longestDrought = useMemo(() => {
    if (!profile) return null;
    return findLongestDrought(summary.games, profile.username);
  }, [profile, summary.games]);
  const busiestDay = useMemo(() => {
    if (!profile) return null;
    return findBusiestDay(summary.games, profile.username);
  }, [profile, summary.games]);
  const highlights = useMemo<Highlights | null>(() => {
    if (!profile) return null;
    return buildHighlights(summary.games, profile.username);
  }, [profile, summary.games]);
  const winLossReasons = useMemo<WinLossReasons | null>(() => {
    if (!profile) return null;
    return buildWinLossReasons(summary.games, profile.username);
  }, [profile, summary.games]);
  return (
    <Container pt="xl" pb="4xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Maker&apos;s Eye Wrapped</Title>
          <Text c="dimmed">
            {profile
              ? `Stats ready for ${profile.username}`
              : "Stats ready. We could not detect a single player yet."}
          </Text>
          {filterRange && (
            <Text size="xs" c="dimmed">
              Filtered to games between{" "}
              {formatRange(filterRange.start, filterRange.end)}.
            </Text>
          )}
        </Stack>

        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Text fw={600}>Upload summary</Text>
                <Text size="xs" c="dimmed">
                  Parsed locally, nothing leaves your browser.
                </Text>
              </Stack>
              {fileName && (
                <Badge variant="light" size="md">
                  {fileName}
                </Badge>
              )}
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <StatPill
                label="Total games"
                value={totalGames.toLocaleString()}
              />
              <StatPill label="Date range" value={formatRange(start, end)} />
              <StatPill
                label="Matched data"
                value={
                  profile
                    ? `${profile.matchedGames}/${totalGames} (${formatPercent(
                        profile.coverage
                      )})`
                    : "Unknown"
                }
              />
              <StatPill
                label="Total minutes"
                value={formatMinutes(aggregates.totalMinutes)}
              />
              <StatPill
                label="Avg games / day"
                value={formatDecimal(aggregates.averageGamesPerDay)}
              />
              <StatPill
                label="Avg minutes / game"
                value={formatDecimal(aggregates.averageMinutesPerGame)}
              />
              <StatPill
                label="Avg minutes / day"
                value={formatDecimal(aggregates.averageMinutesPerDay)}
              />
              <StatPill
                label="Total minutes"
                value={formatMinutes(aggregates.totalMinutes)}
              />
            </SimpleGrid>
            {profile ? (
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  Detected player
                </Text>
                <Text size="lg" fw={700}>
                  {profile.username}
                </Text>
                <Text size="sm" c="dimmed">
                  Runner {profile.runnerGames} · Corp {profile.corpGames} ·
                  Coverage {formatPercent(profile.coverage)}
                </Text>
              </Stack>
            ) : (
              <Alert color="yellow" variant="light">
                Could not determine a single player in this export. You can
                still inspect the raw data below or try another file.
              </Alert>
            )}
          </Stack>
        </Paper>

        {profile && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <RoleRecordCard title="Runner record" record={runnerRecord} />
            <RoleRecordCard title="Corp record" record={corpRecord} />
          </SimpleGrid>
        )}

        {profile && (
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <FavoriteIdentityCard
              title="Favorite Runner ID"
              favorite={favoriteRunner}
            />
            <FavoriteIdentityCard
              title="Favorite Corp ID"
              favorite={favoriteCorp}
            />
            <LongestGameCard longest={longestGame} />
          </SimpleGrid>
        )}

        {profile && <FrequentOpponentCard opponent={frequentOpponent} />}

        {profile && highlights && (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <GameHighlightCard
              title="Most shuffles"
              highlight={highlights.mostShuffles}
              formatValue={(value) => formatCount(value, "shuffle")}
              emptyMessage="No shuffle data yet."
            />
            <GameHighlightCard
              title="Most cards played"
              highlight={highlights.mostCardsPlayed}
              formatValue={(value) => formatCount(value, "card")}
              emptyMessage="No card play data yet."
            />
            <GameHighlightCard
              title="Most cards rezzed"
              highlight={highlights.mostCardsRezzed}
              formatValue={(value) => formatCount(value, "card rezzed")}
              emptyMessage="No rez data yet."
            />
            <GameHighlightCard
              title="Fewest cards rezzed in a corp win"
              highlight={highlights.fewestCardsRezzedCorpWin}
              formatValue={(value) => formatCount(value, "card rezzed")}
              emptyMessage="No corp win data yet."
            />
            <GameHighlightCard
              title="Most runs"
              highlight={highlights.mostRuns}
              formatValue={(value) => formatCount(value, "run")}
              emptyMessage="No run data yet."
            />
            <GameHighlightCard
              title="Most runs per click"
              highlight={highlights.mostRunsPerClick}
              formatValue={(value) => formatPerTurn(value, "run")}
              emptyMessage="No run/click data yet."
            />
            <GameHighlightCard
              title="Most tags taken"
              highlight={highlights.mostTagsTaken}
              formatValue={(value) => formatCount(value, "tag")}
              emptyMessage="No tag data yet."
            />
            <GameHighlightCard
              title="Least runs in a win"
              highlight={highlights.leastRunsInWin}
              formatValue={(value) => formatCount(value, "run")}
              emptyMessage="No winning run data yet."
            />
            <GameHighlightCard
              title="Most damage dealt"
              highlight={highlights.mostDamage}
              formatValue={(value) => `${value} damage`}
              emptyMessage="No damage data yet."
            />
            <GameHighlightCard
              title="Most damage taken"
              highlight={highlights.mostDamageTaken}
              formatValue={(value) => `${value} damage`}
              emptyMessage="No damage taken yet."
            />
            <GameHighlightCard
              title="Most damage taken in a win"
              highlight={highlights.mostDamageTakenWin}
              formatValue={(value) => `${value} damage`}
              emptyMessage="No damage taken wins yet."
            />
            <GameHighlightCard
              title="Most fake credits"
              highlight={highlights.mostFakeCredits}
              formatValue={(value) => formatCount(value, "fake credit")}
              emptyMessage="No fake credits yet."
            />
            <GameHighlightCard
              title="Least unique accesses (agenda win)"
              highlight={highlights.leastUniqueAccessesAgendaWin}
              formatValue={(value) => formatCount(value, "unique access")}
              emptyMessage="No agenda win data yet."
            />
            <GameHighlightCard
              title="Fastest flatline win"
              highlight={highlights.fastestFlatlineWin}
              formatValue={(value) => `${value} turns`}
              emptyMessage="No flatline wins yet."
            />
            <GameHighlightCard
              title="Least credits spent in a win"
              highlight={highlights.leastCreditsSpentWin}
              formatValue={(value) => `${value} credits`}
              emptyMessage="No winning spend data yet."
            />
          </SimpleGrid>
        )}

        {profile && highlights && (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <GameHighlightCard
              title="Most clicks per turn"
              highlight={highlights.mostClicksPerTurn}
              formatValue={(value) => formatPerTurn(value, "click")}
              emptyMessage="No click data yet."
              renderDetails={renderPerTurnDetails}
            />
            <GameHighlightCard
              title="Fewest clicks per turn"
              highlight={highlights.leastClicksPerTurn}
              formatValue={(value) => formatPerTurn(value, "click")}
              emptyMessage="No click data yet."
              renderDetails={renderPerTurnDetails}
            />
            <GameHighlightCard
              title="Most credits per turn"
              highlight={highlights.mostCreditsPerTurn}
              formatValue={(value) => formatPerTurn(value, "credit")}
              emptyMessage="No credit data yet."
              renderDetails={renderPerTurnDetails}
            />
            <GameHighlightCard
              title="Fewest credits per turn"
              highlight={highlights.leastCreditsPerTurn}
              formatValue={(value) => formatPerTurn(value, "credit")}
              emptyMessage="No credit data yet."
              renderDetails={renderPerTurnDetails}
            />
            <GameHighlightCard
              title="Most fake credits per turn"
              highlight={highlights.mostFakeCreditsPerTurn}
              formatValue={(value) => formatPerTurn(value, "fake credit")}
              emptyMessage="No fake credit data yet."
              renderDetails={renderPerTurnDetails}
            />
          </SimpleGrid>
        )}

        {profile && winLossReasons && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <ReasonSummaryCard
              title="Most common win reason"
              summary={winLossReasons.wins}
              emptyMessage="No wins recorded yet."
            />
            <ReasonSummaryCard
              title="Most common loss reason"
              summary={winLossReasons.losses}
              emptyMessage="No losses recorded yet."
            />
          </SimpleGrid>
        )}

        {profile && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <LongestStreakCard streak={longestStreak} />
            <LongestDroughtCard drought={longestDrought} />
          </SimpleGrid>
        )}

        {profile && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <BusiestDayCard busiest={busiestDay} />
            <LongestDurationCard longest={longestDuration} />
          </SimpleGrid>
        )}

        <Group>
          <Button variant="light" onClick={onReset}>
            Upload another JSON
          </Button>
          <BackButton />
        </Group>
      </Stack>
    </Container>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <Paper radius="md" p="md" withBorder>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="lg" fw={700}>
          {value}
        </Text>
      </Stack>
    </Paper>
  );
}

function RoleRecordCard({
  title,
  record,
}: {
  title: string;
  record: RoleRecord | null;
}) {
  if (!record) {
    return (
      <Paper withBorder p="md" radius="md">
        <Text size="sm">{title}: No games detected.</Text>
      </Paper>
    );
  }
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>{title}</Text>
        <Text size="xl" fw={700}>
          {record.wins}-{record.losses}
        </Text>
        <Text size="sm" c="dimmed">
          Win rate {formatPercent(record.winRate)}
        </Text>
      </Stack>
    </Paper>
  );
}

function FavoriteIdentityCard({
  title,
  favorite,
}: {
  title: string;
  favorite: IdentityFavorite | null;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>{title}</Text>
        {favorite ? (
          <>
            <Text size="lg" fw={700}>
              {favorite.identity}
            </Text>
            <Text size="sm" c="dimmed">
              {favorite.games} games · {favorite.wins}-{favorite.losses} ·{" "}
              {formatPercent(favorite.winRate)}
            </Text>
          </>
        ) : (
          <Text size="sm">No games recorded.</Text>
        )}
      </Stack>
    </Paper>
  );
}

function LongestGameCard({ longest }: { longest: LongestGame | null }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>Longest game</Text>
        {longest ? (
          <>
            <Text size="xl" fw={700}>
              {longest.turnCount} turns
            </Text>
            <Text size="sm" c="dimmed">
              As {longest.role} vs {longest.opponent ?? "Unknown"}
            </Text>
            <Text size="sm" c="dimmed">
              {longest.result === "draw"
                ? "Result unknown"
                : `Result: ${longest.result === "win" ? "Win" : "Loss"}`}
              {longest.completedAt
                ? ` · ${formatDate(longest.completedAt)}`
                : ""}
            </Text>
          </>
        ) : (
          <Text size="sm">No turn count data available.</Text>
        )}
      </Stack>
    </Paper>
  );
}

function ReasonSummaryCard({
  title,
  summary,
  emptyMessage,
}: {
  title: string;
  summary: ReasonSummary | null;
  emptyMessage: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>{title}</Text>
        {summary ? (
          <>
            <Text size="lg" fw={700}>
              {summary.reason}
            </Text>
            <Text size="sm" c="dimmed">
              {summary.count}/{summary.total} ({formatPercent(summary.percent)})
            </Text>
          </>
        ) : (
          <Text size="sm">{emptyMessage}</Text>
        )}
      </Stack>
    </Paper>
  );
}

function FrequentOpponentCard({
  opponent,
}: {
  opponent: FrequentOpponent | null;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>Most frequent opponent</Text>
        {opponent ? (
          <>
            <Text size="lg" fw={700}>
              {opponent.username}
            </Text>
            <Text size="sm" c="dimmed">
              {opponent.games} games · {opponent.wins}-{opponent.losses} ·{" "}
              {formatPercent(opponent.winRate)}
            </Text>
          </>
        ) : (
          <Text size="sm">No opponent data available.</Text>
        )}
      </Stack>
    </Paper>
  );
}

function GameHighlightCard({
  title,
  highlight,
  formatValue,
  emptyMessage,
  renderDetails,
}: {
  title: string;
  highlight: GameHighlight | null;
  formatValue: (value: number) => string;
  emptyMessage: string;
  renderDetails?: (highlight: GameHighlight) => ReactNode;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>{title}</Text>
        {highlight ? (
          <>
            <Text size="xl" fw={700}>
              {formatValue(highlight.value)}
            </Text>
            {!renderDetails && (
              <>
                <Text size="sm" c="dimmed">
                  {describeOpponentLine(highlight)}
                </Text>
                {highlight.completedAt && (
                  <Text size="xs" c="dimmed">
                    {formatDate(highlight.completedAt)}
                  </Text>
                )}
              </>
            )}
            {renderDetails && renderDetails(highlight)}
          </>
        ) : (
          <Text size="sm">{emptyMessage}</Text>
        )}
      </Stack>
    </Paper>
  );
}

function LongestStreakCard({ streak }: { streak: LongestStreak | null }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>Longest streak</Text>
        {streak ? (
          <>
            <Text size="xl" fw={700}>
              {streak.days} {streak.days === 1 ? "day" : "days"}
            </Text>
            <Text size="sm" c="dimmed">
              {formatRange(streak.start, streak.end)}
            </Text>
          </>
        ) : (
          <Text size="sm">Not enough games yet.</Text>
        )}
      </Stack>
    </Paper>
  );
}

function LongestDroughtCard({ drought }: { drought: LongestDrought | null }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>Longest drought</Text>
        {drought ? (
          <>
            <Text size="xl" fw={700}>
              {drought.days} {drought.days === 1 ? "day" : "days"}
            </Text>
            <Text size="sm" c="dimmed">
              Between {formatDate(drought.start)} and {formatDate(drought.end)}
            </Text>
          </>
        ) : (
          <Text size="sm">No breaks detected yet.</Text>
        )}
      </Stack>
    </Paper>
  );
}

function BusiestDayCard({ busiest }: { busiest: DayActivityStat | null }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>Busiest day</Text>
        {busiest ? (
          <>
            <Text size="xl" fw={700}>
              {busiest.games} {busiest.games === 1 ? "game" : "games"}
            </Text>
            <Text size="sm" c="dimmed">
              on {formatDate(busiest.date)}
            </Text>
          </>
        ) : (
          <Text size="sm">No dated games available.</Text>
        )}
      </Stack>
    </Paper>
  );
}

function LongestDurationCard({
  longest,
}: {
  longest: LongestDurationGame | null;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text fw={600}>Longest game (time)</Text>
        {longest ? (
          <>
            <Text size="xl" fw={700}>
              {formatMinutes(longest.minutes)}
            </Text>
            <Text size="sm" c="dimmed">
              As {longest.role} vs {longest.opponent ?? "Unknown"}
            </Text>
            <Text size="sm" c="dimmed">
              {longest.result === "draw"
                ? "Result unknown"
                : `Result: ${longest.result === "win" ? "Win" : "Loss"}`}
              {longest.completedAt
                ? ` · ${formatDate(longest.completedAt)}`
                : ""}
            </Text>
          </>
        ) : (
          <Text size="sm">No duration data available.</Text>
        )}
      </Stack>
    </Paper>
  );
}

function formatRange(start: Date | null, end: Date | null) {
  if (!start && !end) return "Unknown";
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (start && end) {
    return `${formatter.format(start)} – ${formatter.format(end)}`;
  }
  const date = start ?? end;
  return date ? formatter.format(date) : "Unknown";
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCount(value: number, noun: string) {
  const unit = pluralizeWord(value, noun);
  return `${value} ${unit}`;
}

function formatPerTurn(value: number, noun: string) {
  return `${formatDecimal(value)} ${pluralizeWord(value, noun)}/turn`;
}

function formatDecimal(value: number) {
  return Number.parseFloat(value.toFixed(2)).toString();
}

function describeOpponentLine(highlight: GameHighlight) {
  const roleLabel = highlight.role === "runner" ? "Runner" : "Corp";
  const opponent = highlight.opponent ?? "Unknown opponent";
  return `As ${roleLabel} vs ${opponent}`;
}

function pluralizeWord(value: number, noun: string) {
  return Math.abs(value - 1) < 0.000001 ? noun : `${noun}s`;
}

function renderPerTurnDetails(highlight: GameHighlight) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {describeOpponentLine(highlight)}
      </Text>
      {highlight.turnCount && (
        <Text size="xs" c="dimmed">
          {highlight.turnCount} turns
        </Text>
      )}
      {highlight.completedAt && (
        <Text size="xs" c="dimmed">
          {formatDate(highlight.completedAt)}
        </Text>
      )}
    </Stack>
  );
}

function formatMinutes(minutes: number) {
  if (!minutes || minutes <= 0) return "0 min";
  const rounded = Math.round(minutes);
  return `${rounded.toLocaleString()} min`;
}
