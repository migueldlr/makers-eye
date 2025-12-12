"use client";

import { shortenId, idToFaction, factionToColor } from "@/lib/util";

export const SYMBOL_TO_UNICODE: Record<string, string> = {
  anarch: "59648",
  criminal: "59649",
  shaper: "59650",
  haas_bioroid: "59651",
  jinteki: "59652",
  nbn: "59653",
  weyland_consortium: "59654",
  adam: "59655",
  apex: "59656",
  sunny_lebeau: "59657",
  neutral: "59658",
  neutral_runner: "59658",
  neutral_corp: "59658",
  credit: "59659",
  "recurring-credit": "59660",
  click: "59661",
  subroutine: "59662",
  trash: "59663",
  trash_cost: "59664",
  link: "59665",
  mu: "59666",
  unknown: "59667",
  "agenda-points": "59668",
  interrupt: "59669",
  hq: "59670",
  "r&d": "59671",
  archives: "59672",
};

// Map faction names to symbol keys
const FACTION_TO_SYMBOL: Record<string, string> = {
  Anarch: "anarch",
  Criminal: "criminal",
  Shaper: "shaper",
  HB: "haas_bioroid",
  Jinteki: "jinteki",
  NBN: "nbn",
  Weyland: "weyland_consortium",
  _Neutral: "neutral",
};


interface FactionIconProps {
  identity: string | null;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export default function FactionIcon({
  identity,
  size = 24,
  color = "currentColor",
  style,
}: FactionIconProps) {
  if (!identity) return null;

  const faction = idToFaction(shortenId(identity));
  if (!faction) return null;

  const symbolKey = FACTION_TO_SYMBOL[faction];
  if (!symbolKey) return null;

  const unicode = SYMBOL_TO_UNICODE[symbolKey];
  if (!unicode) return null;

  const char = String.fromCharCode(parseInt(unicode, 10));

  return (
    <span
      style={{
        fontFamily: "netrunner",
        fontSize: size,
        color,
        lineHeight: 1,
        ...style,
      }}
    >
      {char}
    </span>
  );
}

export function getFactionUnicode(identity: string | null): string | null {
  if (!identity) return null;

  const faction = idToFaction(shortenId(identity));
  if (!faction) return null;

  const symbolKey = FACTION_TO_SYMBOL[faction];
  if (!symbolKey) return null;

  const unicode = SYMBOL_TO_UNICODE[symbolKey];
  if (!unicode) return null;

  return String.fromCharCode(parseInt(unicode, 10));
}

export function getFactionColor(identity: string | null): string {
  if (!identity) return "gray";

  const faction = idToFaction(shortenId(identity));
  if (!faction) return "gray";

  return factionToColor(faction) || "gray";
}
