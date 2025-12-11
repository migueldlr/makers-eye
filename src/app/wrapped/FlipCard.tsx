"use client";

import { ReactNode, useRef, useCallback } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import styles from "./FlipCard.module.css";

// Utility functions (from pokemon-cards-css)
const clamp = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);
const round = (value: number, precision = 3) =>
  parseFloat(value.toFixed(precision));
const adjust = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
) => round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

// Spring config - higher stiffness = snappier response
const springConfig = { stiffness: 300, damping: 30 };

interface FlipCardProps {
  imageSrc: string;
  width?: number;
  height?: number;
  title?: ReactNode;
  subtitle?: ReactNode;
  coverContent?: ReactNode;
  className?: string;
  coverMask?: string; // Mask image URL for cover (initially visible side) shine effect
  onFlip?: (flipped: boolean) => void; // Callback when card is flipped
}

export default function FlipCard({
  imageSrc,
  width = 320,
  height = 450,
  title = "Tap to reveal",
  subtitle = "Hover or tap to flip this card",
  coverContent,
  className,
  coverMask,
  onFlip,
}: FlipCardProps) {
  const flipContainerRef = useRef<HTMLDivElement>(null);
  const flippedRef = useRef(false);

  const handleFlip = useCallback(() => {
    flippedRef.current = !flippedRef.current;
    if (flipContainerRef.current) {
      flipContainerRef.current.style.transform = flippedRef.current
        ? "rotateY(180deg)"
        : "rotateY(0deg)";
    }
    onFlip?.(flippedRef.current);
  }, [onFlip]);

  // Spring values for 3D tilt effect
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);

  // Spring values for holographic shine effect
  const glareX = useSpring(50, springConfig);
  const glareY = useSpring(50, springConfig);
  const glareOpacity = useSpring(0, springConfig);
  const backgroundX = useSpring(50, springConfig);
  const backgroundY = useSpring(50, springConfig);

  // Derived values for styles - V-style multi-layer background positions
  // Layer 1: vertical pillars (moves on Y only)
  // Layer 2: diagonal stripes (moves on both X and Y)
  // Layer 3: radial vignette (moves on both X and Y)
  const shineBackgroundPosition = useTransform(
    [backgroundX, backgroundY],
    ([x, y]) =>
      `0% ${y}%, ${x}% ${y}%, ${x}% ${y}%`
  );
  // Inverted position for the second shine layer
  const shineAfterBackgroundPosition = useTransform(
    [backgroundX, backgroundY],
    ([x, y]) =>
      `0% ${y}%, ${100 - Number(x)}% ${100 - Number(y)}%, ${x}% ${y}%`
  );
  // CSS custom property strings for pointer position (used by radial gradients in CSS)
  const pointerX = useTransform(glareX, (v) => `${v}%`);
  const pointerY = useTransform(glareY, (v) => `${v}%`);
  // Scaled opacities for each layer
  const shineOpacityScaled = useTransform(glareOpacity, (v) => v * 0.6);
  const shineAfterOpacityScaled = useTransform(glareOpacity, (v) => v * 0.4);
  const glareOpacityScaled = useTransform(glareOpacity, (v) => v * 0.3);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = clamp(round((100 / rect.width) * x));
    const percentY = clamp(round((100 / rect.height) * y));
    const centerX = percentX - 50;
    const centerY = percentY - 50;

    // Update tilt springs
    rotateX.set(round(-(centerX / 3.5))); // ~±14deg max
    rotateY.set(round(centerY / 2)); // ~±25deg max

    // Update shine springs
    glareX.set(percentX);
    glareY.set(percentY);
    glareOpacity.set(1);
    backgroundX.set(adjust(percentX, 0, 100, 37, 63));
    backgroundY.set(adjust(percentY, 0, 100, 33, 67));
  };

  const handlePointerLeave = () => {
    // Reset all springs to neutral
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
    glareOpacity.set(0);
    backgroundX.set(50);
    backgroundY.set(50);
  };

  return (
    <div
      className={className}
      style={{
        width,
        height,
        perspective: "1200px",
        cursor: "pointer",
      }}
      onClick={handleFlip}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Tilt wrapper - applies mouse-driven 3D rotation */}
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          rotateX: rotateY, // CSS rotateX rotates around X axis (vertical tilt)
          rotateY: rotateX, // CSS rotateY rotates around Y axis (horizontal tilt)
        }}
      >
        {/* Flip container - handles click-to-flip rotation */}
        <div
          ref={flipContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            transformStyle: "preserve-3d",
            transform: "rotateY(0deg)",
          }}
        >
          {/* Card back (initially visible - face down) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 18,
              overflow: "hidden",
              background: "#2f2f2f",
              color: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: coverContent ? 0 : "2rem",
              textAlign: "center",
              backfaceVisibility: "hidden",
              boxShadow: "0 15px 40px rgba(5, 3, 20, 0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              isolation: "isolate",
            }}
          >
            {coverContent ? (
              coverContent
            ) : (
              <>
                <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                  {title}
                </span>
                {subtitle && (
                  <span
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.95rem",
                      opacity: 0.75,
                    }}
                  >
                    {subtitle}
                  </span>
                )}
              </>
            )}
            {/* Masked shine overlay for card back */}
            {coverMask && (
              <motion.div
                className={styles.shine}
                style={
                  {
                    opacity: shineOpacityScaled,
                    backgroundPosition: shineBackgroundPosition,
                    "--pointer-x": pointerX,
                    "--pointer-y": pointerY,
                    WebkitMaskImage: `url(${coverMask})`,
                    maskImage: `url(${coverMask})`,
                    WebkitMaskSize: "cover",
                    maskSize: "cover",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  } as unknown as React.CSSProperties
                }
              />
            )}
          </div>
          {/* Card front (revealed after flip - face up) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 18,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 15px 40px rgba(5, 3, 20, 0.5)",
              isolation: "isolate",
            }}
          >
            {/* Image container with overflow hidden for border-radius clipping */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              <img
                src={imageSrc}
                alt="Favorite identity"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
            {/* Holographic shine overlay for card front - primary layer */}
            <motion.div
              className={styles.shine}
              style={
                {
                  opacity: shineOpacityScaled,
                  backgroundPosition: shineBackgroundPosition,
                  "--pointer-x": pointerX,
                  "--pointer-y": pointerY,
                } as unknown as React.CSSProperties
              }
            />
            {/* Holographic shine overlay for card front - secondary layer */}
            <motion.div
              className={styles.shineAfter}
              style={
                {
                  opacity: shineAfterOpacityScaled,
                  backgroundPosition: shineAfterBackgroundPosition,
                  "--pointer-x": pointerX,
                  "--pointer-y": pointerY,
                } as unknown as React.CSSProperties
              }
            />
            {/* Glare/spotlight overlay */}
            <motion.div
              className={styles.glare}
              style={
                {
                  opacity: glareOpacityScaled,
                  "--pointer-x": pointerX,
                  "--pointer-y": pointerY,
                } as unknown as React.CSSProperties
              }
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
