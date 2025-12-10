// Fetch identity card images from NetrunnerDB API

interface CardData {
  id: string;
  attributes: {
    title: string;
    printing_ids: string[];
    printings_released_by: string[];
    latest_printing_id: string;
  };
}

interface ApiResponse {
  data: CardData[];
}

export interface IdentityImageMap {
  [title: string]: string;
}

function getImageUrl(card: CardData): string {
  const { printing_ids, printings_released_by, latest_printing_id } =
    card.attributes;

  // Check if any printing is from null_signal_games
  const hasNsgPrinting = printings_released_by.includes("null_signal_games");

  // Find the NSG printing ID if available, otherwise use latest
  let printingId = latest_printing_id;

  if (hasNsgPrinting) {
    // Find the index of nsg in printings_released_by and get corresponding printing_id
    const nsgIndex = printings_released_by.indexOf("null_signal_games");
    if (nsgIndex !== -1 && printing_ids[nsgIndex]) {
      printingId = printing_ids[nsgIndex];
    }
    return `https://card-images.netrunnerdb.com/v2/xlarge/${printingId}.webp`;
  }

  // FFG or other publishers use large/.jpg
  return `https://card-images.netrunnerdb.com/v2/large/${printingId}.jpg`;
}

let cachedImageMap: IdentityImageMap | null = null;

export async function fetchIdentityImageMap(): Promise<IdentityImageMap> {
  if (cachedImageMap) {
    return cachedImageMap;
  }

  try {
    const response = await fetch(
      "https://api.netrunnerdb.com/api/v3/public/cards?filter[search]=card_type:runner_identity|corp_identity"
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    const imageMap: IdentityImageMap = {};

    for (const card of data.data) {
      const title = card.attributes.title;
      imageMap[title] = getImageUrl(card);
    }

    cachedImageMap = imageMap;
    return imageMap;
  } catch (error) {
    console.error("Failed to fetch identity images:", error);
    return {};
  }
}

export function getIdentityImageUrl(
  imageMap: IdentityImageMap,
  identity: string | undefined | null,
  defaultImage: string
): string {
  if (!identity) return defaultImage;

  // Try exact match first
  if (imageMap[identity]) {
    return imageMap[identity];
  }

  // Try case-insensitive match
  const lowerIdentity = identity.toLowerCase();
  for (const [title, url] of Object.entries(imageMap)) {
    if (title.toLowerCase() === lowerIdentity) {
      return url;
    }
  }

  // Try partial match (identity name might be shortened in logs)
  for (const [title, url] of Object.entries(imageMap)) {
    if (
      title.toLowerCase().includes(lowerIdentity) ||
      lowerIdentity.includes(title.toLowerCase())
    ) {
      return url;
    }
  }

  return defaultImage;
}
