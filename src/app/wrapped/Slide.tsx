"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SlideProps {
  children: ReactNode;
  gradient?: string;
  /** If provided, background will animate from initialGradient to gradient */
  initialGradient?: string;
  /** Whether to show the animated gradient (when true, shows gradient; when false, shows initialGradient) */
  showGradient?: boolean;
  /** Vertical alignment of content: "center" (default) or "start" */
  align?: "center" | "start";
}

export default function Slide({
  children,
  gradient,
  initialGradient,
  showGradient = true,
  align = "center",
}: SlideProps) {
  const hasAnimatedBackground = initialGradient !== undefined;

  // For non-animated backgrounds, use simple background
  if (!hasAnimatedBackground) {
    return (
      <section
        style={{
          minHeight: "100vh",
          padding: "5rem 1rem",
          display: "flex",
          alignItems: align === "center" ? "center" : "flex-start",
          justifyContent: "center",
          background: gradient ?? "transparent",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          color: "var(--mantine-color-gray-2)",
        }}
      >
        <motion.div
          style={{ width: "100%", maxWidth: 960 }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.75, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // For animated backgrounds, layer two backgrounds and fade between them
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        padding: "5rem 1rem",
        display: "flex",
        alignItems: align === "center" ? "center" : "flex-start",
        justifyContent: "center",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        color: "var(--mantine-color-gray-2)",
        overflow: "hidden",
      }}
    >
      {/* Initial background layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: initialGradient,
          zIndex: 0,
        }}
      />
      {/* Target gradient layer - fades in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showGradient ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
          zIndex: 1,
        }}
      />
      {/* Content layer */}
      <motion.div
        style={{ width: "100%", maxWidth: 960, position: "relative", zIndex: 2 }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.4 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}
