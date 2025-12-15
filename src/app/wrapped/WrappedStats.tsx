"use client";

import {
  buildFavoriteIdentity,
  buildHighlights,
  buildTopIdentities,
  buildUserRoleRecord,
  findLongestGame,
  findTopOpponents,
  getDateRange,
} from "@/lib/wrapped/processing";
import type {
  GameHighlight,
  Highlights,
  UploadSummary,
} from "@/lib/wrapped/types";
import { Alert, Paper, Stack, Text, Title } from "@mantine/core";
import {
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import Slide from "./Slide";
import SummaryCarousel, { type SummaryStat } from "./SummaryCarousel";
import FlipCardSlide from "./FlipCardSlide";
import RunnerFactionCardBack from "./RunnerFactionCardBack";
import {
  fetchIdentityImageMap,
  getIdentityImageUrl,
  type IdentityImageMap,
} from "@/lib/wrapped/identityImages";
import { shortenId, idToFaction, factionToColor } from "@/lib/util";
import { type HighlightDescriptor } from "./BentoGrid";
import HighlightCarousel from "./HighlightCarousel";
import GameDotsGrid from "./GameDotsGrid";
import RivalsParallaxSection from "./RivalsParallaxSection";
import StreaksSlide from "./StreaksSlide";
import EndSlide from "./EndSlide";
import CreditsSlide from "./CreditsSlide";
import HeroSlide from "./HeroSlide";
import SummarySlide from "./SummarySlide";

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
  cacheWarning,
  onReset,
}: WrappedStatsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const profile = summary.profile;

  // Fetch identity card images from NetrunnerDB
  const [identityImageMap, setIdentityImageMap] = useState<IdentityImageMap>(
    {}
  );
  useEffect(() => {
    fetchIdentityImageMap().then(setIdentityImageMap);
  }, []);

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
  const topRunners = useMemo(() => {
    if (!profile) return [];
    return buildTopIdentities(summary.games, profile.username, "runner", 5);
  }, [profile, summary.games]);
  const topCorps = useMemo(() => {
    if (!profile) return [];
    return buildTopIdentities(summary.games, profile.username, "corp", 5);
  }, [profile, summary.games]);
  const longestGame = useMemo(() => {
    if (!profile) return null;
    return findLongestGame(summary.games, profile.username);
  }, [profile, summary.games]);
  const highlights = useMemo<Highlights | null>(() => {
    if (!profile) return null;
    return buildHighlights(summary.games, profile.username);
  }, [profile, summary.games]);
  const topOpponents = useMemo(() => {
    if (!profile) return [];
    return findTopOpponents(summary.games, profile.username, 200);
  }, [profile, summary.games]);
  const totalUniqueOpponents = useMemo(() => {
    if (!profile) return 0;
    const opponents = new Set<string>();
    for (const game of summary.games) {
      const isRunner = game.runner.username === profile.username;
      const isCorp = game.corp.username === profile.username;
      if (isRunner && game.corp.username) opponents.add(game.corp.username);
      if (isCorp && game.runner.username) opponents.add(game.runner.username);
    }
    return opponents.size;
  }, [profile, summary.games]);
  const frequentRivals = useMemo(() => {
    // Filter by threshold, then adjust to multiple of 3 for seamless hex grid
    const minThreshold = 5;
    const filtered = topOpponents.filter((o) => o.games >= minThreshold);
    const remainder = filtered.length % 3;
    if (remainder === 0) return filtered;
    // Add more opponents to reach multiple of 3
    const needed = 3 - remainder;
    const extras = topOpponents
      .filter((o) => o.games < minThreshold)
      .slice(0, needed);
    return [...filtered, ...extras];
  }, [topOpponents]);

  // Build gradient for summary slide based on top runner/corp factions
  const summaryGradient = useMemo(() => {
    const topRunner = topRunners[0];
    const topCorp = topCorps[0];

    const runnerFaction = topRunner
      ? idToFaction(shortenId(topRunner.identity))
      : null;
    const corpFaction = topCorp
      ? idToFaction(shortenId(topCorp.identity))
      : null;

    const runnerColor = runnerFaction
      ? factionToColor(runnerFaction)
      : "#1a1a3a";
    const corpColor = corpFaction ? factionToColor(corpFaction) : "#0a0a14";

    return `linear-gradient(135deg in oklab, color-mix(in oklab, ${runnerColor}, black 20%), color-mix(in oklab, ${corpColor}, black 20%))`;
  }, [topRunners, topCorps]);

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
      title: "Longest game",
      highlight: highlights?.longestGameRunner ?? null,
      formatValue: (v) => formatCount(v, "turn"),
      emptyMessage: "No turn count data yet.",
    },
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
      title: "Most tags taken",
      highlight: highlights?.mostTagsTaken ?? null,
      formatValue: (v) => formatCount(v, "tag"),
      emptyMessage: "No tag data yet.",
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
    {
      title: "Most cards drawn",
      highlight: highlights?.mostCardsDrawnRunner ?? null,
      formatValue: (v) => formatCount(v, "card"),
      emptyMessage: "No card draw data yet.",
    },
    {
      title: "Most unique accesses",
      highlight: highlights?.mostUniqueAccesses ?? null,
      formatValue: (v) => formatCount(v, "card"),
      emptyMessage: "No access data yet.",
    },
    {
      title: "Most fake credits",
      highlight: highlights?.mostFakeCreditsRunner ?? null,
      formatValue: (v) => `${v}c`,
      emptyMessage: "No credit data yet.",
    },
    {
      title: "Most excess clicks",
      highlight: highlights?.mostExcessClicksRunner ?? null,
      formatValue: (v) => formatCount(v, "click"),
      emptyMessage: "No excess click data yet.",
    },
  ];

  const corpHighlights: HighlightDescriptor[] = [
    {
      title: "Longest game",
      highlight: highlights?.longestGameCorp ?? null,
      formatValue: (v) => formatCount(v, "turn"),
      emptyMessage: "No turn count data yet.",
    },
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
      formatValue: (v) => formatCount(v, "card"),
      emptyMessage: "No rez data yet.",
    },
    {
      title: "Fewest cards rezzed in a win",
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
    {
      title: "Most cards drawn",
      highlight: highlights?.mostCardsDrawnCorp ?? null,
      formatValue: (v) => formatCount(v, "card"),
      emptyMessage: "No card draw data yet.",
    },
    {
      title: "Most excess clicks",
      highlight: highlights?.mostExcessClicksCorp ?? null,
      formatValue: (v) => formatCount(v, "click"),
      emptyMessage: "No excess click data yet.",
    },
  ];

  const gravatarUrl = profile?.emailHash
    ? `https://gravatar.com/avatar/${profile.emailHash}?s=200`
    : null;

  const slides: ReactNode[] = [
    <HeroSlide
      key="hero"
      username={profile?.username ?? null}
      gravatarUrl={gravatarUrl}
      onReset={onReset}
    />,
    <Slide key="intro">
      <Stack align="center" gap="sm">
        <Text size="xl" ta="center">
          Let&apos;s get started, shall we?
        </Text>
      </Stack>
    </Slide>,
    <Slide
      key="summary-carousel"
      gradient="linear-gradient(135deg, #1f1b52, #411858)"
    >
      <Stack align="center" gap="lg" style={{ width: "100%" }}>
        <Title order={2} ta="center">
          You played {totalGames.toLocaleString()} games this year.
          That&apos;s...
        </Title>
        <SummaryCarousel stats={summaryStats} />
      </Stack>
    </Slide>,
    profile && (
      <StreaksSlide
        key="streaks"
        games={summary.games}
        username={profile.username}
      />
    ),
    profile && (
      <GameDotsGrid
        key="game-dots"
        games={summary.games}
        username={profile.username}
        scrollContainerRef={scrollRef}
      />
    ),
    // profile && rolePieData && (
    //   <Slide key="roles" gradient="linear-gradient(145deg, #012a4a, #013a63)">
    //     <Stack gap="lg" align="center">
    //       <Title order={2} ta="center">
    //         This year, you preferred to play as {preferredRoleLabel}.
    //       </Title>
    //       <PieChart
    //         data={rolePieData}
    //         size={300}
    //         withLabels
    //         withLabelsLine
    //         labelsPosition="inside"
    //         labelsType="value"
    //         withTooltip
    //         tooltipDataSource="segment"
    //         startAngle={90}
    //         endAngle={-270}
    //       />
    //     </Stack>
    //   </Slide>
    // ),
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
          <Title order={2}>But of course, you had your favorites.</Title>
        </Stack>
      </Slide>
    ),
    favoriteRunner && (
      <FlipCardSlide
        key="favoriteRunner"
        initialGradient="#000000"
        gradient={
          FACTION_GRADIENTS[idToFaction(shortenId(favoriteRunner.identity))] ??
          FACTION_GRADIENTS._Neutral
        }
        title="Your favorite runner was..."
        imageSrc={getCardImageForIdentity(favoriteRunner.identity)}
        cardTitle="Runner MVP"
        cardSubtitle="Tap to flip"
        coverContent={<RunnerFactionCardBack />}
        coverMask="/cardback/mask-white-on-transparent.png"
        revealTitle={`${shortenId(favoriteRunner.identity)}!`}
        revealSubtitle={`(${favoriteRunner.games} games)`}
      />
    ),
    favoriteCorp && (
      <FlipCardSlide
        key="favoriteCorp"
        initialGradient="#000000"
        gradient={
          FACTION_GRADIENTS[idToFaction(shortenId(favoriteCorp.identity))] ??
          FACTION_GRADIENTS._Neutral
        }
        title="Your go-to corp was..."
        imageSrc={getCardImageForIdentity(favoriteCorp.identity)}
        cardTitle="Corp MVP"
        cardSubtitle="Tap to flip"
        coverContent={
          <img
            src="/cardback/corp-back-2.png"
            alt="Corp card back"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        }
        coverMask="/cardback/corp-mask-2.png"
        revealTitle={`${shortenId(favoriteCorp.identity)}!`}
        revealSubtitle={`(${favoriteCorp.games} games)`}
      />
    ),
    profile && highlights && (
      <Slide
        key="runner-highlights"
        gradient="linear-gradient(120deg, #4a2828, #5e2535)"
      >
        <Stack gap="lg" align="center">
          <Title order={2}>Some fun game records as runner.</Title>
          <HighlightCarousel
            items={runnerHighlights.map((h) => ({
              title: h.title,
              value: h.highlight ? h.formatValue(h.highlight.value) : "—",
              highlight: h.highlight,
              color: "#06b6d4",
            }))}
          />
        </Stack>
      </Slide>
    ),

    profile && highlights && (
      <Slide
        key="corp-highlights"
        gradient="linear-gradient(120deg, #28284a, #253560)"
      >
        <Stack gap="lg" align="center">
          <Title order={2}>And corp as well.</Title>
          <HighlightCarousel
            items={corpHighlights.map((h) => ({
              title: h.title,
              value: h.highlight ? h.formatValue(h.highlight.value) : "—",
              highlight: h.highlight,
              color: "#f43f5e",
            }))}
          />
        </Stack>
      </Slide>
    ),
    profile && frequentRivals.length > 0 && (
      <RivalsParallaxSection
        key="rivals"
        rivals={frequentRivals}
        totalUniqueOpponents={totalUniqueOpponents}
        scrollContainerRef={scrollRef}
      />
    ),
    profile && (
      <SummarySlide
        key="summary"
        username={profile.username}
        gravatarUrl={gravatarUrl}
        gradient={summaryGradient}
        topRunners={topRunners}
        topCorps={topCorps}
        totalGames={totalGames}
        totalMinutes={aggregates.totalMinutes}
        getCardImageForIdentity={getCardImageForIdentity}
      />
    ),
    <CreditsSlide key="credits" />,
    <EndSlide key="cta" onReset={onReset} />,
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
        backgroundColor: "#0a0a14",
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
