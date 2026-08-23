import { describe, expect, it } from "vitest";

import { resolveCobraTopCut } from "./tournament";
import type { Tournament } from "./types";

const playerIds = Array.from({ length: 16 }, (_, index) => 101 + index);

const tournament4977 = {
  cutToTop: 16,
  players: playerIds.map((id, index) => ({
    id,
    name: `Canonical ${id}`,
    rank: index + 1,
  })),
  eliminationPlayers: [
    ...Array.from({ length: 8 }, (_, index) => ({ rank: index + 1 })),
    ...playerIds.slice(8).map((id, index) => ({
      id,
      name: `Stale ${id}`,
      rank: index + 9,
    })),
  ],
  rounds: [
    playerIds.slice(0, 8).map((id, index) => ({
      eliminationGame: true,
      player1: { id, role: "corp", winner: true },
      player2: {
        id: playerIds[index + 8],
        role: "runner",
        winner: false,
      },
    })),
    playerIds.slice(0, 4).map((id, index) => ({
      eliminationGame: true,
      player1: { id, role: "corp", winner: false },
      player2: {
        id: playerIds[index + 4],
        role: "runner",
        winner: true,
      },
    })),
  ],
} satisfies Tournament;

describe("resolveCobraTopCut", () => {
  it("resolves every participant in a tournament-4977-shaped top 16", () => {
    expect(resolveCobraTopCut(tournament4977)).toEqual({
      players: playerIds.map((id) => ({
        id,
        name: `Canonical ${id}`,
        corpIdentity: undefined,
        runnerIdentity: undefined,
      })),
      missingPlayerCount: 0,
    });
  });

  it("propagates trimmed identities from canonical players", () => {
    const tournament = {
      players: [
        {
          id: 1,
          name: "Both",
          corpIdentity: "  AgInfusion: New Miracles for a New World  ",
          runnerIdentity: "  Loup  ",
        },
        {
          id: 2,
          name: "Missing",
          corpIdentity: "   ",
        },
      ],
      eliminationPlayers: [
        { id: 1, rank: 1, corpIdentity: "Stale Corp" },
        { id: 2, rank: 2, runnerIdentity: "Stale Runner" },
      ],
    } satisfies Tournament;

    expect(resolveCobraTopCut(tournament).players).toEqual([
      {
        id: 1,
        name: "Both",
        corpIdentity: "AgInfusion: New Miracles for a New World",
        runnerIdentity: "Loup",
      },
      {
        id: 2,
        name: "Missing",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
    ]);
  });

  it("uses complete unique final elimination ranks", () => {
    const tournament = {
      players: [
        { id: 1, name: "One", rank: 1 },
        { id: 2, name: "Two", rank: 2 },
        { id: 3, name: "Three", rank: 3 },
      ],
      eliminationPlayers: [
        { id: 1, rank: 2 },
        { id: 2, rank: 3 },
        { id: 3, rank: 1 },
      ],
    } satisfies Tournament;

    expect(resolveCobraTopCut(tournament).players).toEqual([
      {
        id: 3,
        name: "Three",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
      {
        id: 1,
        name: "One",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
      {
        id: 2,
        name: "Two",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
    ]);
  });

  it("does not match names or join unsafe and unknown IDs", () => {
    const tournament = {
      cutToTop: 2,
      players: [{ id: 1, name: "Same Name" }],
      eliminationPlayers: [
        { id: 99, name: "Same Name", rank: 1 },
        { id: Number.MAX_SAFE_INTEGER + 1, name: "Unsafe", rank: 2 },
      ],
    } satisfies Tournament;

    expect(resolveCobraTopCut(tournament)).toEqual({
      players: [],
      missingPlayerCount: 2,
    });
  });

  it("ignores IDs found only in Swiss games", () => {
    const tournament = {
      players: [
        { id: 1, name: "Cut Player" },
        { id: 2, name: "Swiss One" },
        { id: 3, name: "Swiss Two" },
      ],
      eliminationPlayers: [{ id: 1, rank: 1 }],
      rounds: [
        [
          {
            eliminationGame: false,
            player1: {
              id: 2,
              runnerScore: 3,
              corpScore: null,
              combinedScore: 3,
            },
            player2: {
              id: 3,
              runnerScore: null,
              corpScore: 0,
              combinedScore: 0,
            },
          },
        ],
      ],
    } satisfies Tournament;

    expect(resolveCobraTopCut(tournament).players).toEqual([
      {
        id: 1,
        name: "Cut Player",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
    ]);
  });

  it("deduplicates repeated elimination evidence", () => {
    const tournament = {
      players: [{ id: 1, name: "  Canonical One  " }],
      eliminationPlayers: [
        { id: 1, rank: 1 },
        { id: 1, rank: 1 },
      ],
      rounds: [
        [
          {
            eliminationGame: true,
            player1: { id: 1, role: "corp", winner: true },
            player2: { role: "runner", winner: false },
          },
          {
            eliminationGame: true,
            player1: { id: 1, role: "runner", winner: true },
            player2: { role: "corp", winner: false },
          },
        ],
      ],
    } satisfies Tournament;

    expect(resolveCobraTopCut(tournament)).toEqual({
      players: [
        {
          id: 1,
          name: "Canonical One",
          corpIdentity: undefined,
          runnerIdentity: undefined,
        },
      ],
      missingPlayerCount: 0,
    });
  });

  it("is deterministic when evidence and canonical players are shuffled", () => {
    const players = [
      { id: 11, name: "Eleven", rank: 1 },
      { id: 12, name: "Twelve", rank: 2 },
      { id: 13, name: "Thirteen", rank: 2 },
    ];
    const eliminationPlayers = [
      { id: 13, rank: 1 },
      { id: 11 },
      { id: 12, rank: 1 },
    ];
    const games: NonNullable<Tournament["rounds"]>[number] = [
      {
        eliminationGame: true,
        player1: { id: 13, role: "corp", winner: true },
        player2: { id: 11, role: "runner", winner: false },
      },
      {
        eliminationGame: true,
        player1: { id: 12, role: "runner", winner: true },
        player2: { id: 13, role: "corp", winner: false },
      },
    ];
    const forward = {
      players,
      eliminationPlayers,
      rounds: [games],
    } satisfies Tournament;
    const shuffled = {
      players: [players[2], players[0], players[1]],
      eliminationPlayers: [
        eliminationPlayers[1],
        eliminationPlayers[2],
        eliminationPlayers[0],
      ],
      rounds: [[games[1], games[0]]],
    } satisfies Tournament;

    expect(resolveCobraTopCut(shuffled)).toEqual(
      resolveCobraTopCut(forward)
    );
    expect(resolveCobraTopCut(forward).players).toEqual([
      {
        id: 11,
        name: "Eleven",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
      {
        id: 12,
        name: "Twelve",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
      {
        id: 13,
        name: "Thirteen",
        corpIdentity: undefined,
        runnerIdentity: undefined,
      },
    ]);
  });
});
