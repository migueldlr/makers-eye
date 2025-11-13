"use client";

import { useState } from "react";

interface HexGridProps {
  rows?: number;
  cols?: number;
  hexSize?: number;
  gap?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacityGradient?: "vertical" | "horizontal" | "radial" | "none";
  className?: string;
  style?: React.CSSProperties;
}

export default function HexGrid({
  rows = 8,
  cols = 4,
  hexSize = 30,
  gap = 4,
  color = "#EB7108",
  strokeColor = "#242424",
  strokeWidth = 0,
  opacityGradient = "none",
  className,
  style,
}: HexGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Hexagon geometry constants (flat-top orientation)
  const width = hexSize * Math.sqrt(3); // Width across the flat sides
  const height = hexSize * 2; // Height from flat top to flat bottom

  // Horizontal and vertical spacing between hexagon centers
  const horizontalSpacing = width + gap;
  const verticalSpacing = height + gap;

  // Calculate SVG dimensions (flat-top)
  const svgWidth = cols * horizontalSpacing + gap * 2;
  // Height: top gap + first hexagon half + spacing between rows + last hexagon half + bottom gap
  const svgHeight = 2 * gap + rows * 1.5 * verticalSpacing;

  // Generate hexagon path with center at (cx, cy) - flat-top orientation
  const generateHexPath = (cx: number, cy: number): string => {
    const angles = [0, 60, 120, 180, 240, 300]; // Offset by 30° for flat-top
    const points = angles.map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x = cx + hexSize * Math.cos(rad);
      const y = cy + hexSize * Math.sin(rad);
      return `${x},${y}`;
    });
    return `M ${points[0]} L ${points.slice(1).join(" L ")} Z`;
  };

  // Calculate opacity based on position
  const getOpacity = (row: number, col: number): number => {
    if (opacityGradient === "none") return 1;

    if (opacityGradient === "vertical") {
      // Bottom to top fade
      const normalized = row / (rows - 1);
      return Math.max(0.05, 1 - normalized * 0.95);
    }

    if (opacityGradient === "horizontal") {
      // Left to right fade
      const normalized = col / (cols - 1);
      return Math.max(0.05, 1 - normalized * 0.95);
    }

    if (opacityGradient === "radial") {
      // Center to edges fade
      const centerRow = (rows - 1) / 2;
      const centerCol = (cols - 1) / 2;
      const maxDistance = Math.sqrt(centerRow ** 2 + centerCol ** 2);
      const distance = Math.sqrt(
        (row - centerRow) ** 2 + (col - centerCol) ** 2
      );
      const normalized = distance / maxDistance;
      return Math.max(0.05, 1 - normalized * 0.95);
    }

    return 1;
  };

  // Generate all hexagons
  const hexagons: Array<{
    path: string;
    cx: number;
    cy: number;
    opacity: number;
    index: number;
  }> = [];
  let index = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Offset every other column for honeycomb pattern (flat-top)
      const yOffset = (col % 2) * (verticalSpacing / 2);
      const cx = gap + width / 2 + col * horizontalSpacing;
      const cy = gap + height / 2 + row * verticalSpacing + yOffset;

      const path = generateHexPath(cx, cy);
      const opacity = getOpacity(row, col);

      hexagons.push({ path, cx, cy, opacity, index });
      index++;
    }
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible", ...style }}
    >
      {hexagons.map((hex) => {
        const isHovered = hoveredIndex === hex.index;

        return (
          <path
            key={hex.index}
            d={hex.path}
            fill={isHovered ? "#FFA940" : color} // Brighter orange on hover
            fillOpacity={hex.opacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{
              transition: isHovered
                ? "fill 0.1s ease-out" // Fast in
                : "fill 2s ease-out", // Slow out
            }}
            onPointerEnter={() => setHoveredIndex(hex.index)}
            onPointerLeave={() => setHoveredIndex(null)}
            onMouseEnter={() => setHoveredIndex(hex.index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        );
      })}
    </svg>
  );
}
