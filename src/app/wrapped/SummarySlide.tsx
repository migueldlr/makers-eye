"use client";

import { ActionIcon, Stack, Title } from "@mantine/core";
import { IconShare } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { domToPng } from "modern-screenshot";
import Slide from "./Slide";
import type { IdentityFavorite } from "@/lib/wrapped/types";
import { shortenId } from "@/lib/util";
import { WRAPPED_YEAR } from "./WrappedUploader";

interface SummarySlideProps {
  username: string;
  gravatarUrl: string | null;
  gradient: string;
  topRunners: IdentityFavorite[];
  topCorps: IdentityFavorite[];
  totalGames: number;
  totalMinutes: number;
  getCardImageForIdentity: (identity: string) => string;
}

export default function SummarySlide({
  username,
  gravatarUrl,
  gradient,
  topRunners,
  topCorps,
  totalGames,
  totalMinutes,
  getCardImageForIdentity,
}: SummarySlideProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleShare = async () => {
    if (!contentRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const element = contentRef.current;

      const dataUrl = await domToPng(element, {
        scale: 3,
      });

      // Scale down the image for smaller file size while keeping crispness
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      const targetScale = 0.5; // Scale down to 1.5x effective (3 * 0.5 = 1.5)
      canvas.width = img.width * targetScale;
      canvas.height = img.height * targetScale;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      const finalDataUrl = canvas.toDataURL("image/png");

      // Create download link
      const link = document.createElement("a");
      link.download = `${username}-jnet-wrapped-${WRAPPED_YEAR}.png`;
      link.href = finalDataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export image:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Slide gradient="linear-gradient(145deg, #1a1a1a, #0a0a0a)">
      <Title order={2} ta="center" mb="md">
        And finally, a nice image for socials.
      </Title>
      <Stack align="center" gap="md">
        <div
          ref={contentRef}
          style={{
            padding: "1.5rem",
            background: gradient,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "white" }}>
            {username}&apos;s {WRAPPED_YEAR}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            {/* Top 5 Runners - fanned */}
            <div style={{ position: "relative", width: 480, height: 190 }}>
              {topRunners.slice(0, 5).map((runner, index) => {
                // Index 0 (top) in center, then 1-2 on sides, 3-4 furthest out
                const positions = [
                  { rotate: 0, x: 0, y: -18, z: 5, width: 138 },
                  { rotate: -8, x: -84, y: -14, z: 3, width: 120 },
                  { rotate: 8, x: 84, y: -14, z: 3, width: 120 },
                  { rotate: -16, x: -168, y: 0, z: 1, width: 120 },
                  { rotate: 16, x: 168, y: 0, z: 1, width: 120 },
                ];
                const pos = positions[index] || positions[2];
                return (
                  <img
                    key={runner.identity}
                    src={getCardImageForIdentity(runner.identity)}
                    alt={shortenId(runner.identity)}
                    crossOrigin="anonymous"
                    style={{
                      position: "absolute",
                      width: pos.width,
                      borderRadius: "4.19%/3%",
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) translateX(${pos.x}px) translateY(${pos.y}px) rotate(${pos.rotate}deg)`,
                      zIndex: pos.z,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                  />
                );
              })}
            </div>
            {/* Top 5 Corps - fanned */}
            <div style={{ position: "relative", width: 480, height: 190 }}>
              {topCorps.slice(0, 5).map((corp, index) => {
                // Index 0 (top) in center, then 1-2 on sides, 3-4 furthest out
                const positions = [
                  { rotate: 0, x: 0, y: -18, z: 5, width: 138 },
                  { rotate: -8, x: -84, y: -14, z: 3, width: 120 },
                  { rotate: 8, x: 84, y: -14, z: 3, width: 120 },
                  { rotate: -16, x: -168, y: 0, z: 1, width: 120 },
                  { rotate: 16, x: 168, y: 0, z: 1, width: 120 },
                ];
                const pos = positions[index] || positions[2];
                return (
                  <img
                    key={corp.identity}
                    src={getCardImageForIdentity(corp.identity)}
                    alt={shortenId(corp.identity)}
                    crossOrigin="anonymous"
                    style={{
                      position: "absolute",
                      width: pos.width,
                      borderRadius: "4.19%/3%",
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) translateX(${pos.x}px) translateY(${pos.y}px) rotate(${pos.rotate}deg)`,
                      zIndex: pos.z,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              gap: "1rem",
            }}
          >
            <div style={{ width: 120 }}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {totalGames.toLocaleString()}
              </div>
              <div
                style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)" }}
              >
                games played
              </div>
            </div>
            {gravatarUrl && (
              <img
                src={gravatarUrl}
                alt={`${username}'s avatar`}
                crossOrigin="anonymous"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "13.6%",
                }}
              />
            )}
            <div style={{ width: 120, textAlign: "right" }}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {totalMinutes.toLocaleString()}
              </div>
              <div
                style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)" }}
              >
                minutes played
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.6)",
              marginTop: "0.5rem",
            }}
          >
            Jnet Wrapped - The Maker&apos;s Eye
          </div>
        </div>
        <ActionIcon
          variant="subtle"
          color="white"
          size="lg"
          onClick={handleShare}
          loading={isExporting}
          aria-label="Share"
        >
          <IconShare style={{ width: "70%", height: "70%" }} />
        </ActionIcon>
      </Stack>
    </Slide>
  );
}
