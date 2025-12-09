"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Bebas_Neue,
  Chakra_Petch,
  Dancing_Script,
  Josefin_Sans,
  Merriweather,
  Pacifico,
  Playfair_Display,
  Playwrite_NO,
  PT_Serif,
  Saira,
} from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600"],
});
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"] });
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
});
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });
const ptSerif = PT_Serif({ subsets: ["latin"], weight: ["400", "700"] });
const saira = Saira({ subsets: ["latin"], weight: ["400", "600"] });
const playwriteNorge = Playwrite_NO({
  weight: ["400"],
  style: ["normal"],
});
const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
});
const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const flickerFonts = [
  playfair.style.fontFamily,
  pacifico.style.fontFamily,
  ptSerif.style.fontFamily,
  dancingScript.style.fontFamily,
  merriweather.style.fontFamily,
  bebasNeue.style.fontFamily,
  saira.style.fontFamily,
  playwriteNorge.style.fontFamily,
  josefinSans.style.fontFamily,
];

export const FlickerTextConfig = {
  baseFont: chakraPetch.style.fontFamily,
  fonts: flickerFonts,
} as const;

interface FlickerTextProps {
  value: string;
}

export default function FlickerText({ value }: FlickerTextProps) {
  const [index, setIndex] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!value || flickerFonts.length === 0) return;
    let timeout: NodeJS.Timeout | null = null;

    const triggerFlicker = () => {
      const sequence: Array<number | null> = Array.from(flickerFonts.keys());
      sequence.push(null);
      let seqIdx = 0;
      const flicker = () => {
        const next = sequence[seqIdx];
        setIndex(next === undefined ? null : next);
        seqIdx += 1;
        if (seqIdx < sequence.length) {
          timeout = setTimeout(flicker, 45);
        } else {
          timeout = setTimeout(triggerFlicker, 5000);
        }
      };
      flicker();
    };

    timeout = setTimeout(triggerFlicker, 5000);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [value]);

  useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) return;
    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };
    updateDimensions();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateDimensions());
      observer.observe(element);
      return () => observer.disconnect();
    }
  }, [value]);

  const containerStyle: CSSProperties = {
    position: "relative",
    display: "inline-block",
    width: dimensions ? `${dimensions.width}px` : undefined,
    height: dimensions ? `${dimensions.height}px` : undefined,
    minWidth: dimensions ? undefined : "10ch",
    minHeight: dimensions ? undefined : "1em",
    verticalAlign: "middle",
    overflow: "visible",
  };

  const baseFont = FlickerTextConfig.baseFont;
  const fontFamily =
    index === null
      ? baseFont
      : flickerFonts[index] ?? FlickerTextConfig.fonts[0] ?? baseFont;

  return (
    <span style={containerStyle}>
      <span
        aria-hidden
        ref={measureRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontFamily: baseFont,
          lineHeight: 1,
          fontSize: "inherit",
        }}
      >
        {value}
      </span>
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          lineHeight: 1,
          fontFamily,
          transition: "font-family 0.08s ease",
        }}
      >
        {value}
      </span>
    </span>
  );
}
