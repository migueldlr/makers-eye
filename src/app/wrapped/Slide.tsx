"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SlideProps {
  children: ReactNode;
  gradient?: string;
}

export default function Slide({ children, gradient }: SlideProps) {
  return (
    <section
      style={{
        minHeight: "100vh",
        padding: "5rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: gradient ?? "transparent",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
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
