"use client";

import { useEffect } from "react";
import { Text, Stack, Divider, ActionIcon, Title } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameHighlight } from "@/lib/wrapped/types";
import { shortenId } from "@/lib/util";
import { createPortal } from "react-dom";
import type { CardRect } from "./types";
import { formatDate, reasonToSentence } from "./utils";
import { getFactionUnicode, getFactionColor } from "./FactionIcon";

interface HighlightModalProps {
  opened: boolean;
  onClose: () => void;
  onExitComplete?: () => void;
  title: string;
  value: string;
  highlight: GameHighlight;
  cardRect: CardRect | null;
}

// Estimated modal height based on content - avoids measurement complexity
const MODAL_HEIGHT = 280;

export default function HighlightModal({
  opened,
  onClose,
  onExitComplete,
  title,
  value,
  highlight,
  cardRect,
}: HighlightModalProps) {
  useEffect(() => {
    if (!opened) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [opened, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  const modalWidth = Math.min(400, window?.innerWidth * 0.9 || 400);
  const modalLeft = (window?.innerWidth || 800) / 2 - modalWidth / 2;
  const modalTop = (window?.innerHeight || 600) / 2 - MODAL_HEIGHT / 2;

  const factionChar = getFactionUnicode(highlight.identity);
  const factionColor = getFactionColor(highlight.identity);

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {opened && cardRect && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              zIndex: 1000,
            }}
          />

          {/* Modal container */}
          <motion.div
            initial={{
              top: cardRect.top,
              left: cardRect.left,
              width: cardRect.width,
              height: cardRect.height,
            }}
            animate={{
              top: modalTop,
              left: modalLeft,
              width: modalWidth,
              height: MODAL_HEIGHT,
            }}
            exit={{
              top: cardRect.top,
              left: cardRect.left,
              width: cardRect.width,
              height: cardRect.height,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            style={{
              position: "fixed",
              background: "rgba(20, 20, 30, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              overflow: "hidden",
              zIndex: 1001,
            }}
          >
            {/* Faction icon background */}
            {factionChar && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.05 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontFamily: "netrunner",
                  fontSize: 280,
                  lineHeight: 1,
                  color: factionColor,
                  pointerEvents: "none",
                }}
              >
                {factionChar}
              </motion.span>
            )}

            {/* Header - uses same Stack layout as card */}
            <div style={{ padding: "1rem" }}>
              <Stack gap={4} align="center">
                <Text c="gray.5" fw={500}>
                  {title}
                </Text>
                <Title order={2} c="white">
                  {value}
                </Title>

                {highlight.completedAt && (
                  <Text size="xs" c="gray.6">
                    {formatDate(highlight.completedAt)}
                  </Text>
                )}
              </Stack>
            </div>

            {/* Details section - fades in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: 0.15, duration: 0.2 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <Divider color="rgba(255, 255, 255, 0.1)" />
              <Stack gap="md" p="lg">
                <Text size="sm" c="gray.4" lh={1.6}>
                  {highlight.identity && (
                    <>
                      You played as{" "}
                      <Text span fw={600} c="white">
                        {shortenId(highlight.identity)}
                      </Text>
                    </>
                  )}
                  {highlight.identity && highlight.opponent && " vs "}
                  {highlight.opponentIdentity && (
                    <Text span fw={600} c="white">
                      {shortenId(highlight.opponentIdentity)}
                      {highlight.opponent && (
                        <Text span c="gray.5" fw={400}>
                          {" "}
                          ({highlight.opponent})
                        </Text>
                      )}
                    </Text>
                  )}
                  {(highlight.identity || highlight.opponent) && ". "}
                  {highlight.turnCount && (
                    <>
                      The game took{" "}
                      <Text span fw={600} c="white">
                        {highlight.turnCount} turn
                        {highlight.turnCount === 1 ? "" : "s"}
                      </Text>
                    </>
                  )}
                  {highlight.turnCount && highlight.reason && " and "}
                  {(() => {
                    const winner =
                      highlight.result === "win"
                        ? highlight.role
                        : highlight.result === "loss"
                        ? highlight.role === "runner"
                          ? "corp"
                          : "runner"
                        : null;
                    const sentence = reasonToSentence(highlight.reason, winner);
                    return (
                      sentence && (
                        <>
                          ended when{" "}
                          <Text span fw={600} c="white">
                            {sentence}
                          </Text>
                        </>
                      )
                    );
                  })()}
                  {(highlight.turnCount || highlight.reason) && "."}
                </Text>
              </Stack>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: 0.15, duration: 0.15 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
              }}
            >
              <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                <IconX size={18} />
              </ActionIcon>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
