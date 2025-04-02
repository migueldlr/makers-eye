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
