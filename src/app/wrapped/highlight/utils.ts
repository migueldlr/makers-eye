export function formatDate(date: Date | null): string {
  if (!date) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatFullDate(date: Date | null): string {
  if (!date) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function reasonToSentence(
  reason: string | null,
  winner: "runner" | "corp" | null
): string | null {
  if (!reason) return null;

  const normalized = reason.trim().toLowerCase();

  // Map known reasons to natural sentences
  if (normalized.includes("agenda")) {
    if (winner === "runner") {
      return "the runner stole enough agendas";
    }
    return "the corp scored enough agendas";
  }

  if (normalized.includes("flatline")) {
    return "the runner was flatlined";
  }

  if (normalized.includes("deck")) {
    if (winner === "runner") {
      return "the corp ran out of cards";
    }
    return "the runner ran out of cards";
  }

  if (normalized === "concede" || normalized === "conceded") {
    if (winner === "runner") {
      return "the corp conceded";
    }
    if (winner === "corp") {
      return "the runner conceded";
    }
    return "a player conceded";
  }

  if (normalized.includes("timeout") || normalized.includes("time")) {
    return "time ran out";
  }

  // Fallback: return the original reason in lowercase
  return reason.toLowerCase();
}
