/**
 * Markov Chain Analysis for Android: Netrunner Identity Rankings
 *
 * Implements a loss-flow Markov chain model to rank identities based on
 * the network topology of wins and losses, not just raw winrates.
 *
 * Algorithm based on reference implementation in ~/personal/netrunner-analysis
 */

// ============================================================================
// Types
// ============================================================================

export interface MatchupRecord {
  identity: string;
  opponent: string;
  wins: number;
  losses: number;
}

export interface MarkovRanking {
  identity: string;
  markovValue: number;
  rawWinrate: number;
  metaShare: number;
  totalGames: number;
}

export interface MarkovAnalysisResult {
  rankings: MarkovRanking[];
  matrix: number[][];
  identities: string[];
  primaryIdentities: Set<string>;
  iterations: number;
  converged: boolean;
}

export interface DualMarkovAnalysisResult {
  corpRankings: MarkovRanking[];
  runnerRankings: MarkovRanking[];
  matrix: number[][];
  identities: string[];
  corpIdentities: Set<string>;
  runnerIdentities: Set<string>;
  iterations: number;
  converged: boolean;
}

interface ConvergenceResult {
  stateVector: number[];
  iterations: number;
  converged: boolean;
}

// ============================================================================
// Matrix Operations
// ============================================================================

/**
 * Transpose a matrix (swap rows and columns)
 */
function matrixTranspose(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  const rows = matrix.length;
  const cols = matrix[0].length;

  const result: number[][] = [];
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}

/**
 * Multiply matrix by vector: result = matrix * vector
 */
function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  const rows = matrix.length;
  const cols = vector.length;

  if (matrix[0].length !== cols) {
    throw new Error("Matrix columns must match vector length");
  }

  const result: number[] = new Array(rows).fill(0);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i] += matrix[i][j] * vector[j];
    }
  }

  return result;
}

/**
 * Calculate maximum absolute difference between two vectors
 */
function vectorMaxDiff(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let maxDiff = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = Math.abs(a[i] - b[i]);
    if (diff > maxDiff) {
      maxDiff = diff;
    }
  }

  return maxDiff;
}

// ============================================================================
// Markov Chain Construction
// ============================================================================

/**
 * Build a loss-flow Markov transition matrix with Laplace smoothing
 *
 * The matrix M[i][j] represents the probability flow from identity i to j.
 * - Diagonal elements: win probability (mass that stays)
 * - Off-diagonal elements: loss probability distributed across opponents
 *
 * @param identities - Sorted list of identity names (all identities: corps + runners)
 * @param primaryIdentities - Identities we're ranking (corps OR runners, not both)
 * @param matchupData - Map of identity -> Map of opponent -> {wins, losses}
 * @param alpha - Laplace smoothing parameter (default 1.0)
 */
function buildLossFlowMatrix(
  identities: string[],
  primaryIdentities: Set<string>,
  matchupData: Map<string, Map<string, { wins: number; losses: number }>>,
  alpha: number = 1.0
): number[][] {
  const n = identities.length;
  const matrix: number[][] = [];

  // Initialize matrix with zeros
  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n).fill(0);
  }

  // Build identity index map
  const indexMap = new Map<string, number>();
  identities.forEach((id, idx) => {
    indexMap.set(id, idx);
  });

  // Fill matrix - build rows for ALL identities (both sides of the matchup)
  for (let i = 0; i < n; i++) {
    const identity = identities[i];
    const opponents = matchupData.get(identity);

    if (!opponents) {
      // No data for this identity - set uniform distribution
      for (let j = 0; j < n; j++) {
        matrix[i][j] = 1.0 / n;
      }
      continue;
    }

    // Calculate totals
    let totalWins = 0;
    let totalLosses = 0;

    for (const { wins, losses } of Array.from(opponents.values())) {
      totalWins += wins;
      totalLosses += losses;
    }

    const totalGames = totalWins + totalLosses;

    if (totalGames === 0) {
      // No games - uniform distribution
      for (let j = 0; j < n; j++) {
        matrix[i][j] = 1.0 / n;
      }
      continue;
    }

    // Diagonal element: probability of winning (with Laplace smoothing)
    const adjustedWins = totalWins + alpha;
    const adjustedTotal = totalGames + 2 * alpha;
    matrix[i][i] = adjustedWins / adjustedTotal;

    // Off-diagonal elements: distribute loss probability
    const adjustedLosses = totalLosses + alpha;
    const lossMass = adjustedLosses / adjustedTotal;

    // Calculate total number of possible opponents (identities on the opposite side)
    // For a primary identity (corp when ranking corps), this is all non-primary (runners)
    // For a non-primary identity (runner when ranking corps), this is all primary (corps)
    const identityIsPrimary = primaryIdentities.has(identity);
    const numPossibleOpponents = identities.filter((id) => {
      const idIsPrimary = primaryIdentities.has(id);
      return id !== identity && idIsPrimary !== identityIsPrimary;
    }).length;

    // Loss normalizer uses RAW losses (not adjusted) + alpha * ALL possible opponents
    // This matches the Rust implementation: losses + alpha * opponents.len()
    const lossNormalizer = totalLosses + alpha * numPossibleOpponents;

    // Distribute loss mass to ALL possible opponents (not just ones played)
    // This matches Rust: iterates through all runners/corps, not just matchup data
    for (const opponent of identities) {
      // Skip self
      if (opponent === identity) {
        continue;
      }

      // Only distribute to identities on the OPPOSITE side
      // (corps to runners, runners to corps)
      const opponentIsPrimary = primaryIdentities.has(opponent);
      const sameSide = identityIsPrimary === opponentIsPrimary;

      if (sameSide) {
        continue; // Skip identities on the same side
      }

      const j = indexMap.get(opponent);
      if (j === undefined) continue;

      // Get matchup data if it exists, otherwise use 0
      const matchup = opponents?.get(opponent);
      const lossesToOpponent = matchup?.losses || 0;

      const adjustedOppLosses = lossesToOpponent + alpha;
      const lossShare = adjustedOppLosses / lossNormalizer;
      matrix[i][j] = lossMass * lossShare;
    }
  }

  return matrix;
}

// ============================================================================
// Iterative Solver
// ============================================================================

/**
 * Solve for steady-state distribution using iterative power method
 *
 * Iterates: state_next = M^T * state until convergence
 *
 * @param matrix - Transition matrix
 * @param epsilon - Convergence threshold (default 1e-9)
 * @param maxIterations - Maximum iterations (default 10000)
 */
function iterativeConvergence(
  matrix: number[][],
  epsilon: number = 1e-12,
  maxIterations: number = 10000
): ConvergenceResult {
  const n = matrix.length;

  if (n === 0) {
    return { stateVector: [], iterations: 0, converged: true };
  }

  // Initialize uniform distribution
  let state: number[] = new Array(n).fill(1.0 / n);

  // Transpose matrix once (we need M^T for iteration)
  const matrixT = matrixTranspose(matrix);

  let stableSteps = 0;
  let converged = false;
  let iterations = 0;

  for (iterations = 0; iterations < maxIterations; iterations++) {
    // Compute next state: state_next = M^T * state
    const nextState = matrixVectorMultiply(matrixT, state);

    // Check convergence
    const maxDiff = vectorMaxDiff(state, nextState);

    if (maxDiff < epsilon) {
      stableSteps++;
      if (stableSteps >= 5) {
        converged = true;
        state = nextState;
        break;
      }
    } else {
      stableSteps = 0;
    }

    state = nextState;
  }

  return { stateVector: state, iterations, converged };
}

// ============================================================================
// Main Computation Function
// ============================================================================

/**
 * Compute Markov chain rankings for identities
 *
 * @param matchupRecords - Array of matchup records (identity vs opponent)
 * @param metaShare - Meta share (percentage) for each identity
 * @param alpha - Laplace smoothing parameter (default 1.0)
 * @returns Object containing rankings, matrix, identities, and primaryIdentities
 */
export function computeMarkovRankings(
  matchupRecords: MatchupRecord[],
  metaShare: Record<string, number>,
  alpha: number = 1.0
): MarkovAnalysisResult {
  // Build matchup data structure
  const matchupData = new Map<
    string,
    Map<string, { wins: number; losses: number }>
  >();
  const identitiesSet = new Set<string>();
  const primaryIdentitiesSet = new Set<string>(); // Track which identities we're actually ranking

  for (const record of matchupRecords) {
    // Add both identity and opponent to build complete bipartite graph
    // (Corps play runners, runners play corps - need both for loss flow)
    identitiesSet.add(record.identity);
    identitiesSet.add(record.opponent);

    // But remember which ones are the "primary" identities we want to rank
    primaryIdentitiesSet.add(record.identity);

    // Store matchup from primary identity's perspective
    if (!matchupData.has(record.identity)) {
      matchupData.set(record.identity, new Map());
    }
    const opponents = matchupData.get(record.identity)!;
    opponents.set(record.opponent, {
      wins: record.wins,
      losses: record.losses,
    });

    // ALSO store the reverse matchup (from opponent's perspective)
    // This allows us to build matrix rows for both sides
    if (!matchupData.has(record.opponent)) {
      matchupData.set(record.opponent, new Map());
    }
    const reverseOpponents = matchupData.get(record.opponent)!;
    reverseOpponents.set(record.identity, {
      wins: record.losses, // opponent's wins = identity's losses
      losses: record.wins, // opponent's losses = identity's wins
    });
  }

  // Convert to sorted array for consistent indexing
  const identities = Array.from(identitiesSet).sort();

  if (identities.length === 0) {
    return {
      rankings: [],
      matrix: [],
      identities: [],
      primaryIdentities: new Set(),
      iterations: 0,
      converged: true,
    };
  }

  if (identities.length === 1) {
    // Edge case: single identity
    const identity = identities[0];
    return {
      rankings: [
        {
          identity,
          markovValue: 1.0,
          rawWinrate: 0.5,
          metaShare: metaShare[identity] || 0,
          totalGames: 0,
        },
      ],
      matrix: [[1.0]],
      identities,
      primaryIdentities: primaryIdentitiesSet,
      iterations: 0,
      converged: true,
    };
  }

  // Build loss-flow matrix
  const matrix = buildLossFlowMatrix(
    identities,
    primaryIdentitiesSet,
    matchupData,
    alpha
  );

  // Solve for steady-state distribution
  const { stateVector, iterations, converged } = iterativeConvergence(matrix);

  console.log(
    `Markov: ${iterations} iterations, converged: ${converged}, matrix: ${identities.length}x${identities.length}, alpha: ${alpha}`
  );

  if (!converged) {
    console.warn(
      `Markov chain did not fully converge after ${iterations} iterations`
    );
  }

  // Calculate raw winrates and total games
  const rawWinrates: Record<string, number> = {};
  const totalGames: Record<string, number> = {};

  for (const identity of identities) {
    const opponents = matchupData.get(identity);

    if (!opponents) {
      rawWinrates[identity] = 0.5;
      totalGames[identity] = 0;
      continue;
    }

    let wins = 0;
    let losses = 0;

    for (const { wins: w, losses: l } of Array.from(opponents.values())) {
      wins += w;
      losses += l;
    }

    totalGames[identity] = wins + losses;
    rawWinrates[identity] =
      totalGames[identity] > 0 ? wins / totalGames[identity] : 0.5;
  }

  // Combine results, but only for primary identities (the ones we're ranking)
  const rankings: MarkovRanking[] = identities
    .filter((identity) => primaryIdentitiesSet.has(identity))
    .map((identity, idx) => {
      const actualIdx = identities.indexOf(identity);
      return {
        identity,
        markovValue: stateVector[actualIdx],
        rawWinrate: rawWinrates[identity] || 0,
        metaShare: metaShare[identity] || 0,
        totalGames: totalGames[identity] || 0,
      };
    });

  // Sort by Markov value (descending)
  rankings.sort((a, b) => b.markovValue - a.markovValue);

  return {
    rankings,
    matrix,
    identities,
    primaryIdentities: primaryIdentitiesSet,
    iterations,
    converged,
  };
}

/**
 * Compute Markov chain rankings for both corps and runners in a single pass
 *
 * Since corps vs runners forms a single bipartite graph, we only need to:
 * 1. Build the transition matrix once
 * 2. Compute the eigenvector once
 * 3. Extract rankings for both sides
 *
 * @param corpMatchupRecords - Matchup records from corp perspective
 * @param runnerMatchupRecords - Matchup records from runner perspective
 * @param corpMetaShare - Meta share for corp identities
 * @param runnerMetaShare - Meta share for runner identities
 * @param alpha - Laplace smoothing parameter
 */
export function computeDualMarkovRankings(
  corpMatchupRecords: MatchupRecord[],
  runnerMatchupRecords: MatchupRecord[],
  corpMetaShare: Record<string, number>,
  runnerMetaShare: Record<string, number>,
  alpha: number = 1.0
): DualMarkovAnalysisResult {
  // Build matchup data structure from BOTH perspectives
  const matchupData = new Map<
    string,
    Map<string, { wins: number; losses: number }>
  >();
  const corpIdentitiesSet = new Set<string>();
  const runnerIdentitiesSet = new Set<string>();

  // Process corp matchups
  for (const record of corpMatchupRecords) {
    corpIdentitiesSet.add(record.identity);
    runnerIdentitiesSet.add(record.opponent);

    if (!matchupData.has(record.identity)) {
      matchupData.set(record.identity, new Map());
    }
    matchupData.get(record.identity)!.set(record.opponent, {
      wins: record.wins,
      losses: record.losses,
    });

    // Add reverse matchup
    if (!matchupData.has(record.opponent)) {
      matchupData.set(record.opponent, new Map());
    }
    matchupData.get(record.opponent)!.set(record.identity, {
      wins: record.losses,
      losses: record.wins,
    });
  }

  // Process runner matchups (might have additional matchups not in corpMatchupRecords)
  for (const record of runnerMatchupRecords) {
    runnerIdentitiesSet.add(record.identity);
    corpIdentitiesSet.add(record.opponent);

    if (!matchupData.has(record.identity)) {
      matchupData.set(record.identity, new Map());
    }
    const existingMatchup = matchupData
      .get(record.identity)!
      .get(record.opponent);
    if (!existingMatchup) {
      matchupData.get(record.identity)!.set(record.opponent, {
        wins: record.wins,
        losses: record.losses,
      });
    }

    // Add reverse matchup
    if (!matchupData.has(record.opponent)) {
      matchupData.set(record.opponent, new Map());
    }
    const existingReverse = matchupData
      .get(record.opponent)!
      .get(record.identity);
    if (!existingReverse) {
      matchupData.get(record.opponent)!.set(record.identity, {
        wins: record.losses,
        losses: record.wins,
      });
    }
  }

  const identities = Array.from(
    new Set([
      ...Array.from(corpIdentitiesSet),
      ...Array.from(runnerIdentitiesSet),
    ])
  ).sort();

  if (identities.length === 0) {
    return {
      corpRankings: [],
      runnerRankings: [],
      matrix: [],
      identities: [],
      corpIdentities: new Set(),
      runnerIdentities: new Set(),
      iterations: 0,
      converged: true,
    };
  }

  // Build loss-flow matrix (corps as primary for matrix construction, but doesn't matter)
  const matrix = buildLossFlowMatrix(
    identities,
    corpIdentitiesSet,
    matchupData,
    alpha
  );

  // Solve for steady-state distribution ONCE
  const { stateVector, iterations, converged } = iterativeConvergence(matrix);

  console.log(
    `Markov: ${iterations} iterations, converged: ${converged}, matrix: ${identities.length}x${identities.length}, alpha: ${alpha}`
  );

  if (!converged) {
    console.warn(
      `Markov chain did not fully converge after ${iterations} iterations`
    );
  }

  // Calculate raw winrates and total games for ALL identities
  const rawWinrates: Record<string, number> = {};
  const totalGames: Record<string, number> = {};
  const metaShare = { ...corpMetaShare, ...runnerMetaShare };

  for (const identity of identities) {
    const opponents = matchupData.get(identity);

    if (!opponents) {
      rawWinrates[identity] = 0.5;
      totalGames[identity] = 0;
      continue;
    }

    let wins = 0;
    let losses = 0;

    for (const { wins: w, losses: l } of Array.from(opponents.values())) {
      wins += w;
      losses += l;
    }

    totalGames[identity] = wins + losses;
    rawWinrates[identity] =
      totalGames[identity] > 0 ? wins / totalGames[identity] : 0.5;
  }

  // Extract corp rankings
  const corpRankings: MarkovRanking[] = identities
    .filter((identity) => corpIdentitiesSet.has(identity))
    .map((identity) => {
      const idx = identities.indexOf(identity);
      return {
        identity,
        markovValue: stateVector[idx],
        rawWinrate: rawWinrates[identity] || 0,
        metaShare: metaShare[identity] || 0,
        totalGames: totalGames[identity] || 0,
      };
    })
    .sort((a, b) => b.markovValue - a.markovValue);

  // Extract runner rankings
  const runnerRankings: MarkovRanking[] = identities
    .filter((identity) => runnerIdentitiesSet.has(identity))
    .map((identity) => {
      const idx = identities.indexOf(identity);
      return {
        identity,
        markovValue: stateVector[idx],
        rawWinrate: rawWinrates[identity] || 0,
        metaShare: metaShare[identity] || 0,
        totalGames: totalGames[identity] || 0,
      };
    })
    .sort((a, b) => b.markovValue - a.markovValue);

  return {
    corpRankings,
    runnerRankings,
    matrix,
    identities,
    corpIdentities: corpIdentitiesSet,
    runnerIdentities: runnerIdentitiesSet,
    iterations,
    converged,
  };
}
