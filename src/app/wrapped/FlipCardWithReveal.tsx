"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import FlipCard from "./FlipCard";

type FlipCardWithRevealProps = {
  imageSrc: string;
  cardTitle: string;
  cardSubtitle: string;
  coverContent?: ReactNode;
  coverMask?: string;
  children: ReactNode;
  onFlip?: (flipped: boolean) => void;
};

export default function FlipCardWithReveal({
  imageSrc,
  cardTitle,
  cardSubtitle,
  coverContent,
  coverMask,
  children,
  onFlip,
}: FlipCardWithRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = (flipped: boolean) => {
    setIsFlipped(flipped);
    onFlip?.(flipped);
  };

  return (
    <div style={{ display: "contents" }}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <FlipCard
          imageSrc={imageSrc}
          width={320}
          height={450}
          title={cardTitle}
          subtitle={cardSubtitle}
          coverContent={coverContent}
          coverMask={coverMask}
          onFlip={handleFlip}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: isFlipped ? 1 : 0,
          y: isFlipped ? 0 : -20,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: 320, position: "relative", zIndex: 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}


