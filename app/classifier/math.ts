import { Decklist } from "./page";

export function cosineSimilarity(decklist1: Decklist, decklist2: Decklist) {
  const allCardNames = new Set([
    ...decklist1.map((card) => card.card_name),
    ...decklist2.map((card) => card.card_name),
  ]);
  const vector1 = Array.from(allCardNames, (cardName) => {
    const card = decklist1.find((card) => card.card_name === cardName);
    return card ? card.card_count : 0;
  });

  const vector2 = Array.from(allCardNames, (cardName) => {
    const card = decklist2.find((card) => card.card_name === cardName);
    return card ? card.card_count : 0;
  });

  const dotProduct = vector1.reduce((acc, val, i) => acc + val * vector2[i], 0);

  const magnitude1 = Math.sqrt(
    vector1.reduce((acc, val) => acc + val * val, 0)
  );
  const magnitude2 = Math.sqrt(
    vector2.reduce((acc, val) => acc + val * val, 0)
  );

  return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
}

export function euclideanDistance(decklist1: Decklist, decklist2: Decklist) {
  const allCardIds = Array.from(
    new Set([
      ...decklist1.map((c) => c.card_name),
      ...decklist2.map((c) => c.card_name),
    ])
  );
  let sumOfSquares = 0;
  for (const cardId of allCardIds) {
    const count1 =
      decklist1.find((c) => c.card_name === cardId)?.card_count ?? 0;
    const count2 =
      decklist2.find((c) => c.card_name === cardId)?.card_count ?? 0;
    sumOfSquares += Math.pow(count1 - count2, 2);
  }

  const distance = Math.sqrt(sumOfSquares);
  return distance;
}

export function jaccardSimilarity(decklist1: Decklist, decklist2: Decklist) {
  const cards1 = new Set(decklist1.map((c) => c.card_name));
  const cards2 = new Set(decklist2.map((c) => c.card_name));

  const intersection = new Set(
    Array.from(cards1).filter((card) => cards2.has(card))
  );
  const union = new Set([...Array.from(cards1), ...Array.from(cards2)]);

  return intersection.size / union.size;
}

export function weightedJaccardSimilarity(
  decklist1: Decklist,
  decklist2: Decklist
) {
  const allCardIds = Array.from(
    new Set([
      ...decklist1.map((c) => c.card_name),
      ...decklist2.map((c) => c.card_name),
    ])
  );

  let minSum = 0;
  let maxSum = 0;

  for (const cardId of allCardIds) {
    const count1 =
      decklist1.find((c) => c.card_name === cardId)?.card_count ?? 0;
    const count2 =
      decklist2.find((c) => c.card_name === cardId)?.card_count ?? 0;
    minSum += Math.min(count1, count2);
    maxSum += Math.max(count1, count2);
  }

  return minSum / maxSum;
}

export function compositionSimilarity(
  decklist1: Decklist,
  decklist2: Decklist
) {
  const typeCounts1 = decklist1.reduce((acc, card) => {
    acc[card.card_type] = (acc[card.card_type] || 0) + card.card_count;
    return acc;
  }, {} as { [key: string]: number });
  const typeCounts2 = decklist2.reduce((acc, card) => {
    acc[card.card_type] = (acc[card.card_type] || 0) + card.card_count;
    return acc;
  }, {} as { [key: string]: number });

  const typeCounts1Normalized = Object.fromEntries(
    Object.entries(typeCounts1).map(([type, count]) => [
      type,
      count / decklist1.length,
    ])
  );
  const typeCounts2Normalized = Object.fromEntries(
    Object.entries(typeCounts2).map(([type, count]) => [
      type,
      count / decklist2.length,
    ])
  );

  const allTypes = Array.from(
    new Set([
      ...Object.keys(typeCounts1Normalized),
      ...Object.keys(typeCounts2Normalized),
    ])
  );

  let dot = 0,
    normA = 0,
    normB = 0;

  for (const type of allTypes) {
    const count1 = typeCounts1Normalized[type] || 0;
    const count2 = typeCounts2Normalized[type] || 0;
    dot += count1 * count2;
    normA += count1 * count1;
    normB += count2 * count2;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export function sameIdentity(decklist1: Decklist, decklist2: Decklist) {
  const identity1 = decklist1.find((c) => c.card_type === "identity");
  const identity2 = decklist2.find((c) => c.card_type === "identity");
  return identity1?.card_name === identity2?.card_name;
}
