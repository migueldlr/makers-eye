"use client";

import { ReactNode, useState } from "react";

interface FlipCardProps {
  imageSrc: string;
  width?: number;
  height?: number;
  title?: ReactNode;
  subtitle?: ReactNode;
  coverContent?: ReactNode;
  className?: string;
}

export default function FlipCard({
  imageSrc,
  width = 320,
  height = 450,
  title = "Tap to reveal",
  subtitle = "Hover or tap to flip this card",
  coverContent,
  className,
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        perspective: "1200px",
        cursor: "pointer",
      }}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
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
            boxShadow: "0 25px 60px rgba(5, 3, 20, 0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
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
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            overflow: "hidden",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            boxShadow: "0 25px 60px rgba(5, 3, 20, 0.7)",
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
      </div>
    </div>
  );
}
