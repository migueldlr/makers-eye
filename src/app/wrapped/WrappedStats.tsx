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
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { PieChart } from "@mantine/charts";
import {
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { FlickerTextConfig } from "./FlickerText";
import Slide from "./Slide";
import SummaryCarousel, { type SummaryStat } from "./SummaryCarousel";
import FlipCardWithReveal from "./FlipCardWithReveal";
import RunnerFactionCardBack from "./RunnerFactionCardBack";
import {
  fetchIdentityImageMap,
  getIdentityImageUrl,
  type IdentityImageMap,
} from "@/lib/wrapped/identityImages";
import { shortenId, idToFaction } from "@/lib/util";
import BentoGrid, { type HighlightDescriptor } from "./BentoGrid";
import GameDotsGrid from "./GameDotsGrid";

// Faction-based gradient backgrounds (using colors from faction SVGs)
const FACTION_GRADIENTS: Record<string, string> = {
  Anarch: "linear-gradient(145deg, #4a2210, #e26b35)", // #e26b35 from NSG_ANARCH.svg
  Criminal: "linear-gradient(145deg, #0d2650, #194c9b)", // #194c9b from NSG_CRIMINAL.svg
  Shaper: "linear-gradient(145deg, #1e3d1e, #4cb148)", // #4cb148 from NSG_SHAPER.svg
  HB: "linear-gradient(145deg, #2d1d4a, #8854b9)", // #8854b9 from hb.svg
  Jinteki: "linear-gradient(145deg, #3d1520, #b14157)", // #b14157 (standard Jinteki red)
  NBN: "linear-gradient(145deg, #4d4510, #ffde00)", // #ffde00 from NSG_NBN.svg
  Weyland: "linear-gradient(145deg, #1e2b1e, #516751)", // #516751 from NSG_WEYLAND.svg
  _Neutral: "linear-gradient(145deg, #2d2d2d, #4a4a4a)",
};

interface WrappedStatsProps {
  summary: UploadSummary;
  fileName: string | null;
  filterRange: { start: Date; end: Date } | null;
  cacheWarning: string | null;
  onReset: () => void;
}

export default function WrappedStats({
  summary,
  fileName,
  filterRange,
  cacheWarning,
  onReset,
}: WrappedStatsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const profile = summary.profile;
  const baseFont = FlickerTextConfig.baseFont;
  const debugFontFamilies = useMemo(() => {
    const fonts = [FlickerTextConfig.baseFont, ...FlickerTextConfig.fonts];
    return Array.from(new Set(fonts.filter(Boolean)));
  }, []);

  // Fetch identity card images from NetrunnerDB
  const [identityImageMap, setIdentityImageMap] = useState<IdentityImageMap>(
    {}
  );
  useEffect(() => {
    fetchIdentityImageMap().then(setIdentityImageMap);
  }, []);

  // Track card flip states for background transitions
  const [runnerCardFlipped, setRunnerCardFlipped] = useState(false);
  const [corpCardFlipped, setCorpCardFlipped] = useState(false);


  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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

  const defaultCardImage =
    "https://card-images.netrunnerdb.com/v2/xlarge/35024.webp";
  const totalGames = summary.games.length;
  const getCardImageForIdentity = useCallback(
    (identity: string | undefined | null) => {
      return getIdentityImageUrl(identityImageMap, identity, defaultCardImage);
    },
    [identityImageMap, defaultCardImage]
  );
  const runnerGames = runnerRecord?.total ?? 0;
  const corpGames = corpRecord?.total ?? 0;
  const preferredRoleLabel =
    runnerGames === corpGames
      ? "both sides equally"
      : runnerGames > corpGames
      ? "runner"
      : "corp";
  const rolePieData = useMemo(() => {
    if (runnerGames === 0 && corpGames === 0) return null;
    return [
      { name: "Runner", value: runnerGames, color: "red" },
      { name: "Corp", value: corpGames, color: "blue" },
    ];
  }, [runnerGames, corpGames]);
  const { totalIdentities, runnerIdentityCount, corpIdentityCount } =
    useMemo(() => {
      if (!profile)
        return {
          totalIdentities: 0,
          runnerIdentityCount: 0,
          corpIdentityCount: 0,
        };
      const username = profile.username;
      const runnerIdentities = new Set<string>();
      const corpIdentities = new Set<string>();
      for (const game of summary.games) {
        if (game.runner.username === username && game.runner.identity) {
          const identity = game.runner.identity.trim();
          if (identity) runnerIdentities.add(identity);
        }
        if (game.corp.username === username && game.corp.identity) {
          const identity = game.corp.identity.trim();
          if (identity) corpIdentities.add(identity);
        }
      }
      const totalIdentitiesSet = new Set<string>();
      runnerIdentities.forEach((identity) => totalIdentitiesSet.add(identity));
      corpIdentities.forEach((identity) => totalIdentitiesSet.add(identity));
      return {
        totalIdentities: totalIdentitiesSet.size,
        runnerIdentityCount: runnerIdentities.size,
        corpIdentityCount: corpIdentities.size,
      };
    }, [profile, summary.games]);
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

  const summaryStats: SummaryStat[] = [
    {
      label: "total minutes in games",
      value: aggregates.totalMinutes.toLocaleString(),
    },
    {
      label: "average games per day",
      value: formatDecimal(aggregates.averageGamesPerDay),
    },
    {
      label: "average minutes per day",
      value: formatDecimal(aggregates.averageMinutesPerDay),
    },
  ];

  const runnerHighlights: HighlightDescriptor[] = [
    {
      title: "Most runs",
      highlight: highlights?.mostRuns ?? null,
      formatValue: (v) => formatCount(v, "run"),
      emptyMessage: "No run data yet.",
    },
    {
      title: "Least runs in a win",
      highlight: highlights?.leastRunsInWin ?? null,
      formatValue: (v) => formatCount(v, "run"),
      emptyMessage: "No winning run data yet.",
    },
    {
      title: "Most damage taken",
      highlight: highlights?.mostDamageTaken ?? null,
      formatValue: (v) => `${v} damage`,
      emptyMessage: "No damage taken yet.",
    },
    {
      title: "Most damage taken in a win",
      highlight: highlights?.mostDamageTakenWin ?? null,
      formatValue: (v) => `${v} damage`,
      emptyMessage: "No damage taken wins yet.",
    },
    {
      title: "Most tags taken",
      highlight: highlights?.mostTagsTaken ?? null,
      formatValue: (v) => formatCount(v, "tag"),
      emptyMessage: "No tag data yet.",
    },
    {
      title: "Most shuffles",
      highlight: highlights?.mostShufflesRunner ?? null,
      formatValue: (v) => formatCount(v, "shuffle"),
      emptyMessage: "No shuffle data yet.",
    },
    {
      title: "Most cards played",
      highlight: highlights?.mostCardsPlayedRunner ?? null,
      formatValue: (v) => formatCount(v, "card"),
      emptyMessage: "No card play data yet.",
    },
    {
      title: "Fastest agenda win",
      highlight: highlights?.fastestAgendaWin ?? null,
      formatValue: (v) => formatCount(v, "turn"),
      emptyMessage: "No agenda wins yet.",
    },
  ];

  const corpHighlights: HighlightDescriptor[] = [
    {
      title: "Most damage dealt",
      highlight: highlights?.mostDamage ?? null,
      formatValue: (v) => `${v} damage`,
      emptyMessage: "No damage data yet.",
    },
    {
      title: "Fastest flatline win",
      highlight: highlights?.fastestFlatlineWin ?? null,
      formatValue: (v) => `${v} turns`,
      emptyMessage: "No flatline wins yet.",
    },
    {
      title: "Most cards rezzed",
      highlight: highlights?.mostCardsRezzed ?? null,
      formatValue: (v) => formatCount(v, "card rezzed"),
      emptyMessage: "No rez data yet.",
    },
    {
      title: "Fewest cards rezzed (corp win)",
      highlight: highlights?.fewestCardsRezzedCorpWin ?? null,
      formatValue: (v) => formatCount(v, "card"),
      emptyMessage: "No corp win data yet.",
    },
    {
      title: "Most shuffles",
      highlight: highlights?.mostShufflesCorp ?? null,
      formatValue: (v) => formatCount(v, "shuffle"),
      emptyMessage: "No shuffle data yet.",
    },
    {
      title: "Most cards played",
      highlight: highlights?.mostCardsPlayedCorp ?? null,
      formatValue: (v) => formatCount(v, "card"),
      emptyMessage: "No card play data yet.",
    },
    {
      title: "Most credits/turn",
      highlight: highlights?.mostCreditsPerTurnCorp ?? null,
      formatValue: (v) => formatPerTurn(v, "credit"),
      emptyMessage: "No credit data yet.",
      renderDetails: renderPerTurnDetails,
    },
    {
      title: "Most clicks/turn",
      highlight: highlights?.mostClicksPerTurnCorp ?? null,
      formatValue: (v) => formatPerTurn(v, "click"),
      emptyMessage: "No click data yet.",
      renderDetails: renderPerTurnDetails,
    },
  ];

  const slides: ReactNode[] = [
    <Slide key="hero" gradient="radial-gradient(circle, #0c0b1d, #02010a)">
      <Stack align="center" gap="sm">
        <Title
          order={1}
          ta="center"
          size={64}
          style={{ fontFamily: baseFont, lineHeight: 1.05 }}
        >
          Hey, {profile ? profile.username : "Welcome back"}.
        </Title>
        <Text size="xl" ta="center">
          Welcome to your Jnet Wrapped 2025.
        </Text>
      </Stack>
    </Slide>,
    <Slide>
      <Stack align="center" gap="sm">
        <Text size="xl" ta="center">
          Let's get started, shall we?
        </Text>
      </Stack>
    </Slide>,
    <Slide
      key="summary-carousel"
      gradient="linear-gradient(135deg, #1f1b52, #411858)"
    >
      <Stack align="center" gap="lg" style={{ width: "100%" }}>
        <Title order={2} ta="center">
          You played {totalGames.toLocaleString()} games this year. That's...
        </Title>
        <SummaryCarousel stats={summaryStats} />
      </Stack>
    </Slide>,
    profile && (
      <GameDotsGrid
        key="game-dots"
        games={summary.games}
        username={profile.username}
        scrollContainerRef={scrollRef}
      />
    ),
    profile && rolePieData && (
      <Slide key="roles" gradient="linear-gradient(145deg, #012a4a, #013a63)">
        <Stack gap="lg" align="center">
          <Title order={2} ta="center">
            This year, you preferred to play as {preferredRoleLabel}.
          </Title>
          <PieChart
            data={rolePieData}
            size={300}
            withLabels
            withLabelsLine
            labelsPosition="inside"
            labelsType="value"
            withTooltip
            tooltipDataSource="segment"
            startAngle={90}
            endAngle={-270}
          />
        </Stack>
      </Slide>
    ),
    profile && (
      <Slide
        key="identities"
        gradient="linear-gradient(145deg, #1a1a2e, #16213e)"
      >
        <Stack align="center" gap="lg">
          <Title order={2}>
            You played {totalIdentities} identities this year.
          </Title>
          <Title order={4} c="gray.5">
            ({runnerIdentityCount} runners and {corpIdentityCount} corps, to be
            exact)
          </Title>
          <Title order={2}>
            But some identities stood out more than others.
          </Title>
        </Stack>
      </Slide>
    ),
    favoriteRunner && (
      <Slide
        key="favoriteRunner"
        initialGradient="#000000"
        gradient={
          FACTION_GRADIENTS[idToFaction(shortenId(favoriteRunner.identity))] ??
          FACTION_GRADIENTS._Neutral
        }
        showGradient={runnerCardFlipped}
      >
        <Stack align="center" gap="lg">
          <Title order={2}>Your favorite runner was...</Title>
          <FlipCardWithReveal
            imageSrc={getCardImageForIdentity(favoriteRunner.identity)}
            cardTitle="Runner MVP"
            cardSubtitle="Tap to flip"
            coverContent={<RunnerFactionCardBack />}
            coverMask="/cardback/mask-white-on-transparent.png"
            onFlip={setRunnerCardFlipped}
          >
            <Stack align="center" gap="xs">
              <Title order={2} fw={700}>
                {shortenId(favoriteRunner.identity)}!
              </Title>
              <Title order={4} c="gray.5">
                ({favoriteRunner.games} games)
              </Title>
            </Stack>
          </FlipCardWithReveal>
        </Stack>
      </Slide>
    ),
    favoriteCorp && (
      <Slide
        key="favoriteCorp"
        initialGradient="#000000"
        gradient={
          FACTION_GRADIENTS[idToFaction(shortenId(favoriteCorp.identity))] ??
          FACTION_GRADIENTS._Neutral
        }
        showGradient={corpCardFlipped}
      >
        <Stack align="center" gap="lg">
          <Title order={2}>Your go-to corp was...</Title>
          <FlipCardWithReveal
            imageSrc={getCardImageForIdentity(favoriteCorp.identity)}
            cardTitle="Corp MVP"
            cardSubtitle="Tap to flip"
            coverContent={
              <img
                src="/cardback/corp-card-back.png"
                alt="Corp card back"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            }
            coverMask="/cardback/corp-mask.png"
            onFlip={setCorpCardFlipped}
          >
            <Stack align="center" gap="xs">
              <Title order={2} fw={700}>
                {shortenId(favoriteCorp.identity)}!
              </Title>
              <Title order={4} c="gray.5">
                ({favoriteCorp.games} games)
              </Title>
            </Stack>
          </FlipCardWithReveal>
        </Stack>
      </Slide>
    ),
    profile && highlights && (
      <Slide
        key="runner-highlights"
        gradient="linear-gradient(120deg, #360033, #0b8793)"
      >
        <div>
          <Title order={2} mb="lg">
            Runner highlights
          </Title>
          <BentoGrid items={runnerHighlights} />
        </div>
      </Slide>
    ),
    profile && highlights && (
      <Slide
        key="corp-highlights"
        gradient="linear-gradient(135deg, #0f0c29, #302b63)"
      >
        <div>
          <Title order={2} mb="lg">
            Corp highlights
          </Title>
          <BentoGrid items={corpHighlights} />
        </div>
      </Slide>
    ),
    profile && (
      <Slide
        key="opponents"
        gradient="linear-gradient(140deg, #2a0845, #6441a5)"
      >
        <Stack gap="lg">
          <Title order={2}>Rivals & outcomes</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <FrequentOpponentCard opponent={frequentOpponent} />
            {winLossReasons && (
              <ReasonSummaryCard
                title="Most common win reason"
                summary={winLossReasons.wins}
                emptyMessage="No wins recorded yet."
              />
            )}
            {winLossReasons && (
              <ReasonSummaryCard
                title="Most common loss reason"
                summary={winLossReasons.losses}
                emptyMessage="No losses recorded yet."
              />
            )}
          </SimpleGrid>
        </Stack>
      </Slide>
    ),
    profile && (
      <Slide
        key="font-debug"
        gradient="linear-gradient(160deg, #111111, #222233)"
      >
        <Stack gap="lg" align="center">
          <Title order={2}>Font Debug</Title>
          <Paper
            withBorder
            radius="md"
            p="xl"
            style={{ width: "100%", maxWidth: 640 }}
          >
            <Stack gap="sm" align="stretch">
              {debugFontFamilies.map((fontName, idx) => (
                <Text
                  key={`${fontName}-${idx}`}
                  size="xl"
                  fw={600}
                  ta="center"
                  style={{
                    fontFamily: fontName,
                    lineHeight: 1.1,
                  }}
                >
                  {profile.username}
                </Text>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Slide>
    ),
    profile && (
      <Slide key="tempo" gradient="linear-gradient(150deg, #0b486b, #f56217)">
        <Stack gap="lg">
          <Title order={2}>Streaks & pace</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <LongestStreakCard streak={longestStreak} />
            <LongestDroughtCard drought={longestDrought} />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <BusiestDayCard busiest={busiestDay} />
            <LongestDurationCard longest={longestDuration} />
          </SimpleGrid>
        </Stack>
      </Slide>
    ),
    <Slide key="cta" gradient="linear-gradient(135deg, #200122, #6f0000)">
      <Stack align="center" gap="md">
        <Title order={2} ta="center">
          Ready for another run?
        </Title>
        <Text ta="center" size="lg">
          Upload another log or head back to the dashboard for live games.
        </Text>
        <Group justify="center">
          <Button
            variant="gradient"
            gradient={{ from: "pink", to: "orange" }}
            onClick={onReset}
          >
            Upload another JSON
          </Button>
          <BackButton />
        </Group>
      </Stack>
    </Slide>,
  ].filter(Boolean) as ReactNode[];

  const scrollByStep = useCallback(
    (direction: 1 | -1) => {
      const container = scrollRef.current;
      if (!container) return;
      const viewportHeight = container.clientHeight || window.innerHeight;
      if (!viewportHeight) return;
      const currentIndex = Math.round(container.scrollTop / viewportHeight);
      const nextIndex = Math.max(
        0,
        Math.min(slides.length - 1, currentIndex + direction)
      );
      if (nextIndex === currentIndex) return;
      container.scrollTo({
        top: nextIndex * viewportHeight,
        behavior: "smooth",
      });
    },
    [slides.length]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, [contenteditable='true'], [role='textbox']"
        )
      ) {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey)
      ) {
        event.preventDefault();
        scrollByStep(1);
      } else if (
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        (event.key === " " && event.shiftKey)
      ) {
        event.preventDefault();
        scrollByStep(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollByStep]);

  return (
    <div
      ref={scrollRef}
      style={{
        backgroundColor: "#010104",
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
        overscrollBehavior: "none",
        overscrollBehaviorY: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {cacheWarning && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "1.25rem 1rem 0.5rem",
          }}
        >
          <Alert
            color="yellow"
            radius="md"
            title="Cache unavailable"
            variant="light"
          >
            {cacheWarning}
          </Alert>
        </div>
      )}
      {slides.map((slide, index) => (
        <div key={index}>{slide}</div>
      ))}
    </div>
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

function SummaryGrid({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      {stats.map((stat) => (
        <StatPill key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </SimpleGrid>
  );
}
