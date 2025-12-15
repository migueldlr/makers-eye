"use client";

import { ActionIcon, Stack, Title } from "@mantine/core";
import { IconShare } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { domToPng } from "modern-screenshot";
import Slide from "./Slide";
import type { IdentityFavorite } from "@/lib/wrapped/types";
import { shortenId } from "@/lib/util";

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
        scale: 2,
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `${username}-jnet-wrapped-2025.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export image:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Slide gradient="linear-gradient(145deg, #1a1a1a, #0a0a0a)">
      <Stack align="center" gap="md">
        <Title order={2} ta="center">
          Finally, a nice image for socials.
        </Title>
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
            {username}&apos;s 2025
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {/* Top 3 Runners */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {topRunners.map((runner) => (
                <img
                  key={runner.identity}
                  src={getCardImageForIdentity(runner.identity)}
                  alt={shortenId(runner.identity)}
                  crossOrigin="anonymous"
                  style={{
                    width: 150,
                    borderRadius: "4.19%/3%",
                  }}
                />
              ))}
            </div>
            {/* Top 3 Corps */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {topCorps.map((corp) => (
                <img
                  key={corp.identity}
                  src={getCardImageForIdentity(corp.identity)}
                  alt={shortenId(corp.identity)}
                  crossOrigin="anonymous"
                  style={{
                    width: 150,
                    borderRadius: "4.19%/3%",
                  }}
                />
              ))}
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
              <div style={{ fontSize: "1rem", color: "#909296" }}>
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
              <div style={{ fontSize: "1rem", color: "#909296" }}>
                minutes played
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#909296",
              marginTop: "0.5rem",
            }}
          >
            Jnet Wrapped from The Maker&apos;s Eye
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
