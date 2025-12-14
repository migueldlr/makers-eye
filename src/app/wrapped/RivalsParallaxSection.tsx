"use client";

import { Stack, Text, Title, Tooltip } from "@mantine/core";
import type { TopOpponent } from "@/lib/wrapped/types";
import { useRef, useEffect, useMemo, useCallback, memo } from "react";

interface RivalsParallaxSectionProps {
  rivals: TopOpponent[];
  totalUniqueOpponents: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

// Seeded random shuffle for consistent ordering
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Ease out cubic for smoother animations
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default memo(function RivalsParallaxSection({
  rivals,
  totalUniqueOpponents,
  scrollContainerRef,
}: RivalsParallaxSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Refs for top 3 flying elements (separate from carousel)
  const top3FlyingRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const top3DetailsRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  // Refs for top 3 rivals in both grid copies (to capture visible positions)
  // Key format: "a-username" or "b-username"
  const top3CarouselRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Captured starting positions (relative to sticky container)
  const capturedStartPositions = useRef<{ x: number; y: number }[] | null>(
    null
  );

  // Track carousel scroll offset
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useRef(0);
  const autoScrollRef = useRef<number | null>(null);
  const isAutoScrollPaused = useRef(false);

  // Get top 3 opponents (sorted by games played)
  const top3 = useMemo(() => {
    return [...rivals].sort((a, b) => b.games - a.games).slice(0, 3);
  }, [rivals]);

  const top3Usernames = useMemo(
    () => new Set(top3.map((r) => r.username)),
    [top3]
  );

  // Shuffle all rivals for the hex grid
  const shuffledRivals = useMemo(
    () => seededShuffle(rivals, rivals.length),
    [rivals]
  );

  // Hex grid configuration
  const hexSize = 26;
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * 2;
  const rows = 3;
  const cols = Math.ceil(shuffledRivals.length / rows);
  const colSpacing = hexWidth * 1.1;
  const gridWidth = cols * colSpacing;
  const gridHeight = rows * hexHeight * 1.05 + hexHeight * 0.3;

  // Final top 3 size and positions
  const finalTop3Size = 80;
  const finalTop3Spacing = 100;

  // Title texts
  const TITLES = [
    `You played against ${totalUniqueOpponents} different opponents this year.`,
    "Here's your top 3 opponents:",
  ];
  const SUBTITLES = [
    "(This is only some of them)",
    // "Your most common opponents:",
  ];

  // Auto-scroll and wheel handling for carousel
  useEffect(() => {
    const track = carouselTrackRef.current;
    const carousel = carouselRef.current;
    if (!track || !carousel) return;

    // Track if user has interacted (stops auto-scroll permanently until parallax resets)
    let userInteracted = false;

    const updateTransform = () => {
      // Wrap around for infinite scroll
      if (scrollOffset.current <= -gridWidth) {
        scrollOffset.current += gridWidth;
      } else if (scrollOffset.current > 0) {
        scrollOffset.current -= gridWidth;
      }
      track.style.transform = `translateX(${scrollOffset.current}px)`;
    };

    // Auto-scroll animation loop
    let lastTime = performance.now();
    const autoScroll = (time: number) => {
      if (!isAutoScrollPaused.current && !userInteracted) {
        const delta = (time - lastTime) * 0.03; // pixels per ms
        scrollOffset.current -= delta;
        updateTransform();
      }
      lastTime = time;
      autoScrollRef.current = requestAnimationFrame(autoScroll);
    };
    autoScrollRef.current = requestAnimationFrame(autoScroll);

    // Stop auto-scroll on mouse enter
    const handleMouseEnter = () => {
      userInteracted = true;
    };

    // Wheel handler - intercept horizontal scroll or shift+scroll
    const handleWheel = (e: WheelEvent) => {
      // Check if this is a horizontal scroll gesture
      // Either: actual horizontal delta, OR shift key held (common convention)
      const isHorizontal =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;

      if (!isHorizontal) return; // Let vertical scroll pass through

      userInteracted = true;
      e.preventDefault();
      e.stopPropagation();

      // Use deltaX if available, otherwise use deltaY (for shift+scroll)
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      scrollOffset.current -= delta;
      updateTransform();
    };

    // Attach event listeners
    carousel.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });
    carousel.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      carousel.removeEventListener("wheel", handleWheel, { capture: true });
      carousel.removeEventListener("mouseenter", handleMouseEnter);
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [gridWidth]);

  // Scroll-driven animation
  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;
    if (!scrollContainer || !containerRef.current) return;

    let animationFrame: number | null = null;
    let lastTitleIndex = 0;
    let lastProgress = 0;

    const handleScroll = () => {
      if (animationFrame) return;

      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        const container = containerRef.current;
        const stickyContainer = stickyContainerRef.current;
        const carousel = carouselRef.current;
        if (!container || !stickyContainer) return;

        const containerRect = container.getBoundingClientRect();
        const scrollContainerRect = scrollContainer.getBoundingClientRect();

        // Early exit if not in view
        if (
          containerRect.bottom < scrollContainerRect.top ||
          containerRect.top > scrollContainerRect.bottom
        ) {
          return;
        }

        // Calculate progress
        const containerTop = containerRect.top - scrollContainerRect.top;
        const scrollableDistance =
          container.offsetHeight - scrollContainer.clientHeight;
        const progress = Math.max(
          0,
          Math.min(1, -containerTop / scrollableDistance)
        );

        const easedProgress = easeOutCubic(progress);

        // Fade out the entire carousel and disable pointer events when faded
        if (carousel) {
          carousel.style.opacity = String(1 - easedProgress);
          carousel.style.pointerEvents = progress > 0 ? "none" : "auto";
        }

        // Calculate center of sticky container for final positions
        const stickyRect = stickyContainer.getBoundingClientRect();
        const centerX = stickyRect.width / 2;
        const centerY = stickyRect.height / 2;

        // Calculate final positions for top 3 (horizontally centered)
        // #1 in center, #2 and #3 offset down slightly
        const totalWidth = 3 * finalTop3Size + 2 * finalTop3Spacing;
        const finalStartX = centerX - totalWidth / 2;

        // Pause auto-scroll and capture positions when scroll begins
        if (progress > 0 && lastProgress === 0) {
          // Pause the auto-scroll
          isAutoScrollPaused.current = true;

          // Capture positions from the tracked elements
          // Find the visible copy (either from grid "a" or grid "b")
          const positions: { x: number; y: number }[] = [];
          const viewportLeft = stickyRect.left;
          const viewportRight = stickyRect.right;

          top3.forEach((rival) => {
            // Try both grid copies, pick the one that's visible
            const elA = top3CarouselRefs.current.get(`a-${rival.username}`);
            const elB = top3CarouselRefs.current.get(`b-${rival.username}`);

            let bestEl: HTMLDivElement | null = null;
            let bestRect: DOMRect | null = null;

            // Check which element is visible (within viewport)
            for (const el of [elA, elB]) {
              if (!el) continue;
              const rect = el.getBoundingClientRect();
              // Check if element center is within the viewport
              const centerX = rect.left + rect.width / 2;
              if (centerX >= viewportLeft && centerX <= viewportRight) {
                bestEl = el;
                bestRect = rect;
                break;
              }
            }

            // Fallback: use whichever is closer to viewport center
            if (!bestEl) {
              const viewportCenterX = (viewportLeft + viewportRight) / 2;
              let minDist = Infinity;
              for (const el of [elA, elB]) {
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const dist = Math.abs(centerX - viewportCenterX);
                if (dist < minDist) {
                  minDist = dist;
                  bestEl = el;
                  bestRect = rect;
                }
              }
            }

            if (bestEl && bestRect) {
              positions.push({
                x: bestRect.left - stickyRect.left,
                y: bestRect.top - stickyRect.top,
              });
            }
          });

          if (positions.length === top3.length) {
            capturedStartPositions.current = positions;
          }
        }

        // Resume auto-scroll and reset captured positions when scroll returns to 0
        if (progress === 0 && lastProgress > 0) {
          capturedStartPositions.current = null;
          isAutoScrollPaused.current = false;
        }

        lastProgress = progress;

        // Animate top 3 flying elements
        top3FlyingRefs.current.forEach((el, index) => {
          if (!el) return;

          // Use captured positions if available
          let startPos = capturedStartPositions.current?.[index];

          // If no captured position and we're scrolling, try to capture now
          if (!startPos && progress > 0) {
            const rival = top3[index];
            const elA = top3CarouselRefs.current.get(`a-${rival.username}`);
            const elB = top3CarouselRefs.current.get(`b-${rival.username}`);

            // Find the visible one
            const viewportLeft = stickyRect.left;
            const viewportRight = stickyRect.right;
            let bestRect: DOMRect | null = null;

            for (const el of [elA, elB]) {
              if (!el) continue;
              const rect = el.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              if (centerX >= viewportLeft && centerX <= viewportRight) {
                bestRect = rect;
                break;
              }
            }

            // Fallback to closest
            if (!bestRect) {
              const viewportCenterX = (viewportLeft + viewportRight) / 2;
              let minDist = Infinity;
              for (const el of [elA, elB]) {
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const dist = Math.abs(centerX - viewportCenterX);
                if (dist < minDist) {
                  minDist = dist;
                  bestRect = rect;
                }
              }
            }

            if (bestRect) {
              startPos = {
                x: bestRect.left - stickyRect.left,
                y: bestRect.top - stickyRect.top,
              };
              if (!capturedStartPositions.current) {
                capturedStartPositions.current = [];
              }
              capturedStartPositions.current[index] = startPos;
            }
          }

          const startX = startPos?.x ?? 0;
          const startY = startPos?.y ?? centerY;

          // Final position: horizontal row with #1 in center, #2 left, #3 right
          // #2 and #3 offset down slightly
          const positions = [1, 0, 2]; // Map index 0->#1 to center, 1->#2 to left, 2->#3 to right
          const posIndex = positions[index];
          const finalX =
            finalStartX + posIndex * (finalTop3Size + finalTop3Spacing);
          const baseY = centerY - finalTop3Size / 2 - 30;
          const finalY = index === 0 ? baseY - 20 : baseY + 20; // #1 higher, #2 and #3 lower

          // Interpolate position
          const x = lerp(startX, finalX, easedProgress);
          const y = lerp(startY, finalY, easedProgress);

          // Scale from small to final size
          const scale = lerp((hexSize * 2) / finalTop3Size, 1, easedProgress);

          // Flying elements are fully visible as soon as scroll starts (instant swap)
          const flyingOpacity = progress > 0 ? 1 : 0;
          el.style.opacity = String(flyingOpacity);
          el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

          // Hide the carousel copies of this rival (both grids) and disable tooltips
          const rival = top3[index];
          const elA = top3CarouselRefs.current.get(`a-${rival.username}`);
          const elB = top3CarouselRefs.current.get(`b-${rival.username}`);
          if (elA) {
            elA.style.opacity = progress > 0 ? "0" : "1";
            elA.style.pointerEvents = progress > 0 ? "none" : "auto";
          }
          if (elB) {
            elB.style.opacity = progress > 0 ? "0" : "1";
            elB.style.pointerEvents = progress > 0 ? "none" : "auto";
          }
        });

        // Fade in detail labels
        const detailOpacity = Math.max(0, (progress - 0.6) / 0.4);
        top3DetailsRefs.current.forEach((el) => {
          if (el) {
            el.style.opacity = String(detailOpacity);
          }
        });

        // Update titles with direction-aware animation
        if (titleRef.current && subtitleRef.current) {
          const titleIndex = progress > 0.3 ? 1 : 0;
          if (lastTitleIndex !== titleIndex) {
            const isScrollingDown = titleIndex > lastTitleIndex;
            lastTitleIndex = titleIndex;

            // Animate title with direction awareness
            titleRef.current.style.transition = "none";
            titleRef.current.style.opacity = "0";
            titleRef.current.style.transform = isScrollingDown
              ? "translateY(20px)"
              : "translateY(-20px)";
            titleRef.current.textContent = TITLES[titleIndex];

            // Force reflow
            titleRef.current.offsetHeight;

            // Slide in
            titleRef.current.style.transition =
              "opacity 0.2s ease-out, transform 0.2s ease-out";
            titleRef.current.style.opacity = "1";
            titleRef.current.style.transform = "translateY(0)";

            // Animate subtitle with direction awareness
            subtitleRef.current.style.transition = "none";
            subtitleRef.current.style.opacity = "0";
            subtitleRef.current.style.transform = isScrollingDown
              ? "translateY(20px)"
              : "translateY(-20px)";
            subtitleRef.current.textContent = SUBTITLES[titleIndex];

            // Force reflow
            subtitleRef.current.offsetHeight;

            // Slide in
            subtitleRef.current.style.transition =
              "opacity 0.2s ease-out, transform 0.2s ease-out";
            subtitleRef.current.style.opacity = "1";
            subtitleRef.current.style.transform = "translateY(0)";
          }
        }
      });
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [
    scrollContainerRef,
    hexSize,
    finalTop3Size,
    finalTop3Spacing,
    top3,
    TITLES,
    SUBTITLES,
  ]);

  // Render a single hex grid
  const renderGrid = useCallback(
    (keyPrefix: string) => (
      <div
        style={{
          position: "relative",
          width: gridWidth,
          height: gridHeight,
          flexShrink: 0,
        }}
      >
        {shuffledRivals.map((opponent, index) => {
          const row = index % rows;
          const col = Math.floor(index / rows);
          const isOddRow = row % 2 === 1;
          const x = col * colSpacing + (isOddRow ? colSpacing / 2 : 0);
          const y = row * hexHeight * 1.05;

          const gravatarUrl = opponent.emailHash
            ? `https://gravatar.com/avatar/${opponent.emailHash}?s=200&d=retro`
            : `https://gravatar.com/avatar/?s=200&d=retro`;

          // Track refs for top 3 in both grid copies
          const isTop3 = top3Usernames.has(opponent.username);
          const refKey = `${keyPrefix}-${opponent.username}`;

          return (
            <Tooltip
              key={`${keyPrefix}-${opponent.username}`}
              label={
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    {opponent.username}
                  </Text>
                  <Text size="xs">{opponent.games} games</Text>
                </Stack>
              }
              withArrow
            >
              <div
                ref={
                  isTop3
                    ? (el) => {
                        if (el) {
                          top3CarouselRefs.current.set(refKey, el);
                        } else {
                          top3CarouselRefs.current.delete(refKey);
                        }
                      }
                    : undefined
                }
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                }}
              >
                <img
                  src={gravatarUrl}
                  alt={opponent.username}
                  style={{
                    width: hexSize * 2,
                    height: hexSize * 2,
                    borderRadius: (hexSize * 2 * 3) / 22,
                  }}
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
    ),
    [
      shuffledRivals,
      gridWidth,
      gridHeight,
      rows,
      colSpacing,
      hexHeight,
      hexSize,
      top3Usernames,
    ]
  );

  return (
    <div
      ref={containerRef}
      style={{
        height: "200vh",
        position: "relative",
        background: "linear-gradient(145deg, #1a1a2e, #4a1942)",
      }}
    >
      {/* Snap points */}
      <div
        style={{
          position: "absolute",
          top: 0,
          height: "1px",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          height: "1px",
          scrollSnapAlign: "end",
          scrollSnapStop: "always",
        }}
      />

      {/* Sticky container */}
      <div
        ref={stickyContainerRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Titles positioned just above the carousel */}
        <Stack
          gap="xs"
          align="center"
          style={{
            position: "absolute",
            top: `calc(50% - ${gridHeight / 2 + 24}px)`,
            transform: "translateY(-100%)",
          }}
        >
          <Title order={2} ta="center" ref={titleRef}>
            {TITLES[0]}
          </Title>
          <Title order={4} c="gray.5" ta="center" ref={subtitleRef}>
            {SUBTITLES[0]}
          </Title>
        </Stack>

        {/* Carousel - fades out on scroll, uses JS for infinite scroll */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            width: "100vw",
            overflow: "hidden",
            willChange: "opacity",
          }}
          ref={carouselRef}
        >
          <div
            ref={carouselTrackRef}
            style={{
              display: "flex",
              padding: "1rem 0",
              willChange: "transform",
            }}
          >
            {renderGrid("a")}
            {renderGrid("b")}
          </div>
        </div>

        {/* Top 3 flying elements - positioned absolutely, animated */}
        {top3.map((rival, index) => {
          const gravatarUrl = rival.emailHash
            ? `https://gravatar.com/avatar/${rival.emailHash}?s=200&d=retro`
            : `https://gravatar.com/avatar/?s=200&d=retro`;

          return (
            <div
              key={`flying-${rival.username}`}
              ref={(el) => {
                top3FlyingRefs.current[index] = el;
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: finalTop3Size,
                height: finalTop3Size,
                opacity: 0,
                transformOrigin: "top left",
                willChange: "transform, opacity",
                pointerEvents: "none",
              }}
            >
              <img
                src={gravatarUrl}
                alt={rival.username}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: (finalTop3Size * 3) / 22,
                }}
              />
            </div>
          );
        })}

        {/* Top 3 detail labels - fade in at end */}
        {top3.map((rival, index) => {
          const totalWidth = 3 * finalTop3Size + 2 * finalTop3Spacing;
          // Position: #1 in center, #2 left, #3 right
          const positions = [1, 0, 2];
          const posIndex = positions[index];
          const offsetX =
            -totalWidth / 2 +
            finalTop3Size / 2 +
            posIndex * (finalTop3Size + finalTop3Spacing);
          // Match the vertical offset: #1 is 20px higher, #2 and #3 are 20px lower
          const offsetY =
            finalTop3Size / 2 + 28 + (index === 0 ? -20 : 20) - 30;

          return (
            <div
              key={`detail-${rival.username}`}
              ref={(el) => {
                top3DetailsRefs.current[index] = el;
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                textAlign: "center",
                opacity: 0,
                pointerEvents: "none",
                willChange: "opacity",
              }}
            >
              <Text fw={600} size="lg" c="white">
                {rival.username}
              </Text>
              <Text size="sm" c="gray.4">
                {rival.games} games
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
});
