import { Decklist } from "@/app/mlstuff/page";
import {
  ALL_ARCHETYPES,
  CORP_ARCHETYPES,
  RUNNER_ARCHETYPES,
} from "./archetypes";

export const DEFAULT_UNKNOWN_ID = "<Missing ID>";

const ID_MAPPING = {
  "419: Amoral Scammer": "419",
  "A Teia: IP Recovery": "A Teia",
  "Acme Consulting: The Truth You Need": "Acme",
  "AgInfusion: New Miracles for a New World": "AgInfusion",
  "Akiko Nisei: Head Case": "Akiko",
  "Alice Merchant: Clan Agitator": "Alice",
  "Ampère: Cybernetics For Anyone": "Ampère",
  "Ampere: Cybernetics For Anyone": "Ampère",
  "Arissana Rocha Nahu: Street Artist": "Arissana",
  "Asa Group: Security Through Vigilance": "Asa",
  'Ayla "Bios" Rahim: Simulant Specialist': "Ayla",
  "Ayla “Bios” Rahim: Simulant Specialist": "Ayla",
  "Az McCaffrey: Mechanical Prodigy": "Az",
  "Azmari EdTech: Shaping the Future": "Azmari",
  "Captain Padma Isbister: Intrepid Explorer": "Padma",
  "Earth Station: SEA Headquarters": "Earth Station",
  "Epiphany Analytica: Nations Undivided": "Epiphany",
  "Esâ Afontov: Eco-Insurrectionist": "Esâ",
  "Esa Afontov: Eco-Insurrectionist": "Esâ",
  "Freedom Khumalo: Crypto-Anarchist": "Freedom",
  "GameNET: Where Dreams are Real": "GameNET",
  "Haas-Bioroid: Architects of Tomorrow": "AoT",
  "Haas-Bioroid: Precision Design": "PD",
  "Hoshiko Shiro: Untold Protagonist": "Hosh",
  "Hyoubu Institute: Absolute Clarity": "Hyoubu",
  "Issuaq Adaptics: Sustaining Diversity": "Issuaq",
  "Jemison Astronautics: Sacrifice. Audacity. Success.": "Jemison",
  "Jinteki: Personal Evolution": "PE",
  "Jinteki: Restoring Humanity": "RH",
  "Kabonesa Wu: Netspace Thrillseeker": "Kabonesa",
  'Ken "Express" Tenma: Disappeared Clone': "Ken",
  "Ken “Express” Tenma: Disappeared Clone": "Ken",
  "Lat: Ethical Freelancer": "Lat",
  "Liza Talking Thunder: Prominent Legislator": "Liza",
  "Los: Data Hijacker": "Los",
  "Mercury: Chrome Libertador": "Mercury",
  "MirrorMorph: Endless Iteration": "MirrorMorph",
  "Mti Mwekundu: Life Improved": "Mti",
  'Nathaniel "Gnat" Hall: One-of-a-Kind': "Gnat",
  "NBN: Reality Plus": "R+",
  "Near-Earth Hub: Broadcast Center": "NEH",
  "Nova Initiumia: Catalyst & Impetus": "Nova",
  "Nuvem SA: Law of the Land": "Nuvem",
  'Nyusha "Sable" Sintashta: Symphonic Prodigy': "Sable",
  "Ob Superheavy Logistics: Extract. Export. Excel.": "Ob",
  "Pravdivost Consulting: Political Solutions": "Pravdivost",
  "Quetzal: Free Spirit": "Quetzal",
  "Reina Roja: Freedom Fighter": "Reina",
  'René "Loup" Arcemont: Party Animal': "Loup",
  'Rene "Loup" Arcemont: Party Animal': "Loup",
  "René “Loup” Arcemont: Party Animal": "Loup",
  "Rielle “Kit” Peddler: Transhuman": "Kit",
  'Rielle "Kit" Peddler: Transhuman': "Kit",
  "Saraswati Mnemonics: Endless Exploration": "Saraswati",
  "Sebastião Souza Pessoa: Activist Organizer": "Seb",
  "Sebastiao Souza Pessoa: Activist Organizer": "Seb",
  "Sportsmetal: Go Big or Go Home": "Sportsmetal",
  "SSO Industries: Fueling Innovation": "SSO",
  "Steve Cambridge: Master Grifter": "Steve",
  "Tāo Salonga: Telepresence Magician": "Tāo",
  "Tao Salonga: Telepresence Magician": "Tāo",
  "The Outfit: Family Owned and Operated": "Outfit",
  "Thule Subsea: Safety Below": "Thule",
  "Thunderbolt Armaments: Peace Through Power": "Thunderbolt",
  "Weyland Consortium: Building a Better World": "BABW",
  "Weyland Consortium: Built to Last": "BtL",
  "Zahya Sadeghi: Versatile Smuggler": "Zahya",

  "Ryō “Phoenix” Ōno: Out of the Ashes": "Phoenix",
  "Ryo “Phoenix” Ono: Out of the Ashes": "Phoenix",
  'Ryō "Phoenix" Ōno: Out of the Ashes': "Phoenix",
  'Ryo "Phoenix" Ono: Out of the Ashes': "Phoenix",
  "Topan: Ormas Leader": "Topan",
  'Barry "Baz" Wong: Tri-Maf Veteran': "Baz",
  "Barry “Baz” Wong: Tri-Maf Veteran": "Baz",
  "MuslihaT: Multifarious Marketeer": "MuslihaT",
  "Dewi Subrotoputri: Pedagogical Dhalang": "Dewi",
  "Magdalene Keino-Chemutai: Cryptarchitect": "Mag",
  "LEO Construction: Labor Solutions": "LEO",
  "Poétrï Luxury Brands: All the Rage": "Poétrï",
  "Poetri Luxury Brands: All the Rage": "Poétrï",
  "AU Co.: The Gold Standard in Clones": "AU Co.",
  "PT Untaian: Life's Building Blocks": "Untaian",
  "Nebula Talent Management: Making Stars": "Nebula",
  "Synapse Global: Faster than Thought": "Synapse",
  "BANGUN: When Disaster Strikes": "BANGUN",
  "The Zwicky Group: Invisible Hands": "Zwicky",
};

const FACTION_MAPPING = {
  "419": "Criminal",
  "A Teia": "Jinteki",
  Acme: "NBN",
  AgInfusion: "Jinteki",
  Akiko: "Shaper",
  Alice: "Anarch",
  Ampère: "_Neutral",
  Arissana: "Shaper",
  Asa: "HB",
  Ayla: "Shaper",
  Az: "Criminal",
  Azmari: "NBN",
  Padma: "Shaper",
  "Earth Station": "Weyland",
  Epiphany: "NBN",
  Esâ: "Anarch",
  Freedom: "Anarch",
  GameNET: "NBN",
  AoT: "HB",
  PD: "HB",
  Hosh: "Anarch",
  Hyoubu: "Jinteki",
  Issuaq: "Jinteki",
  Jemison: "Weyland",
  PE: "Jinteki",
  RH: "Jinteki",
  Kabonesa: "Shaper",
  Ken: "Criminal",
  Lat: "Shaper",
  Liza: "Criminal",
  Los: "Criminal",
  Mercury: "Criminal",
  MirrorMorph: "HB",
  Mti: "Jinteki",
  Gnat: "Anarch",
  "R+": "NBN",
  NEH: "NBN",
  Nova: "_Neutral",
  Nuvem: "Weyland",
  Sable: "Criminal",
  Ob: "Weyland",
  Pravdivost: "NBN",
  Quetzal: "Anarch",
  Reina: "Anarch",
  Loup: "Anarch",
  Kit: "Shaper",
  Saraswati: "Jinteki",
  Seb: "Anarch",
  Sportsmetal: "HB",
  SSO: "Weyland",
  Steve: "Criminal",
  Tāo: "Shaper",
  Outfit: "Weyland",
  Thule: "HB",
  Thunderbolt: "HB",
  BABW: "Weyland",
  BtL: "Weyland",
  Zahya: "Criminal",
  [DEFAULT_UNKNOWN_ID]: "_Neutral",

  Phoenix: "Anarch",
  Topan: "Anarch",
  Baz: "Criminal",
  MuslihaT: "Criminal",
  Dewi: "Shaper",
  Mag: "Shaper",
  LEO: "HB",
  Poétrï: "HB",
  "AU Co": "Jinteki",
  Untaian: "Jinteki",
  Nebula: "NBN",
  Synapse: "NBN",
  BANGUN: "Weyland",
  Zwicky: "Weyland",
};

export const FACTION_NAMES = [
  "Anarch",
  "Criminal",
  "Shaper",
  "HB",
  "Jinteki",
  "NBN",
  "Weyland",
  "_Neutral",
];

const FACTION_COLORS = {
  Anarch: "#d9693f",
  Criminal: "#3862df",
  Shaper: "#60a260",
  HB: "#8854b9",
  Jinteki: "#b14157",
  NBN: "#FFDE00",
  Weyland: "#458c45",
  _Neutral: "gray",
};

export const shortenId = (id?: string) => {
  if (id == null || id === "") return DEFAULT_UNKNOWN_ID;
  return ID_MAPPING[id as keyof typeof ID_MAPPING] ?? id;
};

export const idToFaction = (id?: string) => {
  if (id == null) return "_Neutral";
  return FACTION_MAPPING[id as keyof typeof FACTION_MAPPING] ?? id;
};

export const factionToColor = (faction?: string) => {
  if (faction == null) return "";
  return FACTION_COLORS[faction as keyof typeof FACTION_COLORS] ?? faction;
};

export function mergeObjects<T>(
  a: Record<string, T[]>,
  b: Record<string, T[]>
) {
  const merged: Record<string, T[]> = {};
  for (const key in a) {
    if (a[key] && b[key]) {
      merged[key] = [...a[key], ...b[key]];
    } else if (a[key]) {
      merged[key] = a[key];
    }
  }
  for (const key in b) {
    if (!merged[key]) {
      merged[key] = b[key];
    }
  }
  return merged;
}

export const URLS = {
  cobra: `https://tournaments.nullsignal.games/tournaments/`,
  aesops: `https://www.aesopstables.net/`,
};

export function parseUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname.includes("aesops")) {
    return ["aesops", parsed.pathname.split("/")[1]];
  }
  if (parsed.hostname.includes("tournaments.nullsignal")) {
    return ["cobra", parsed.pathname.split("/")[2]];
  }
  return null;
}

export function normalizeUrl(url: string) {
  const parsed = parseUrl(url);
  if (!parsed) return url;
  const [site, id] = parsed;
  return `${URLS[site as keyof typeof URLS]}${id}`;
}

export const DEFAULT_NONE = "<none>";

export const REGION_OPTIONS = ["Americas", "EMEA", "APAC"];

export const LOCATION_OPTIONS = ["Online", "Paper"];

export const DEFAULT_META = "24.12";

export const SITE_TITLE = "The Maker's Eye - Netrunner tournament analysis";

export const TOURNAMENT_FILTER_KEY = "tournamentFilter";
export const START_DATE_FILTER_KEY = "startDate";
export const END_DATE_FILTER_KEY = "endDate";
export const REGION_FILTER_KEY = "region";
export const ONLINE_FILTER_KEY = "online";
export const PHASE_FILTER_KEY = "phase";

export function isWithinDateRange(
  startDate: string,
  endDate: string,
  date: string | null
) {
  if (date == null) return false;
  return (
    (startDate === "" || date >= startDate) &&
    (endDate === "" || date <= endDate)
  );
}

export const RADIAN = Math.PI / 180;

export function convertRange(
  value: number,
  r1: [number, number],
  r2: [number, number]
) {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

export const NRDB_URL = "https://netrunnerdb.com/api/2.0/public";

export function getNrdbLink(decklistId: string) {
  return `https://netrunnerdb.com/en/decklist/${decklistId}`;
}

export function getIdentity(decklist: Decklist) {
  const identity = decklist.find(
    (card) => card.card_type === "identity"
  )?.card_name;
  if (!identity) {
    return null;
  }
  return identity;
}

export function getCardTypeDistribution(decklist: Decklist) {
  return decklist.reduce((acc, card) => {
    acc[card.card_type] = (acc[card.card_type] || 0) + card.card_count;
    return acc;
  }, {} as { [key: string]: number });
}

export function evalRule(decklist: Decklist, rule: string) {
  const ruleParts = rule.split(/[^A-Za-z0-9]/);
  const left = ruleParts[0];
  const right = Number(ruleParts[1]);
  const operator = rule.match(/[^A-Za-z0-9]/)?.[0];

  const distribution = getCardTypeDistribution(decklist);

  if (left === "total") {
    const total = decklist.reduce((acc, card) => acc + card.card_count, 0);

    if (operator === "<") {
      return total < right;
    } else if (operator === ">") {
      return total > right;
    } else if (operator === "=") {
      return total === right;
    }
  }

  if (operator === "<") {
    return distribution[left] < right;
  } else if (operator === ">") {
    return distribution[left] > right;
  } else if (operator === "=") {
    return distribution[left] === right;
  }

  return false;
}

export function getArchetype(decklist: Decklist) {
  const identity = getIdentity(decklist);
  if (!identity) {
    return "Unknown";
  }

  const archetypes =
    ALL_ARCHETYPES[shortenId(identity) as keyof typeof ALL_ARCHETYPES];

  if (!archetypes) {
    return "Unknown";
  }

  if (typeof archetypes === "string") {
    return archetypes;
  }

  for (const archetype of archetypes) {
    if (typeof archetype === "string") {
      return archetype;
    }
    let found = true;
    for (const archetypeCard of archetype.slice(0, archetype.length - 1)) {
      if (archetypeCard.match(/[<>=]/)) {
        if (!evalRule(decklist, archetypeCard)) {
          found = false;
          break;
        }
      } else if (!decklist.some((card) => card.card_name === archetypeCard)) {
        found = false;
        break;
      }
    }
    if (found) {
      return archetype[archetype.length - 1];
    }
  }

  return "Unknown";
}

export function groupDecklistsByIdentity(idToCardsMap: {
  [key: number]: Decklist;
}) {
  const groupedDecklists: Record<string, { id: string; decklist: Decklist }[]> =
    {};

  for (const [decklistId, decklist] of Object.entries(idToCardsMap)) {
    const identity = decklist.find(
      (card) => card.card_type === "identity"
    )?.card_name;

    if (!identity) {
      continue;
    }
    if (!groupedDecklists[identity]) {
      groupedDecklists[identity] = [];
    }
    groupedDecklists[identity].push({
      id: decklistId,
      decklist,
    });
  }

  return groupedDecklists;
}
