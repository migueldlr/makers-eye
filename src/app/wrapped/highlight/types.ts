import type { GameHighlight } from "@/lib/wrapped/types";

export interface HighlightCardData {
  title: string;
  value: string;
  highlight: GameHighlight | null;
  color?: string;
}

export interface CardRect {
  top: number;
  left: number;
  width: number;
  height: number;
}
