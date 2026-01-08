"use client";

import { getMarkovMatchData } from "@/app/stats/actions";
import { computeDualMarkovRankings, MarkovRanking } from "@/lib/markov";
import MarkovRankingChart from "../charts/MarkovRankingChart";
import MarkovValueChart from "../charts/MarkovValueChart";
import MarkovFlowMatrix from "../charts/MarkovFlowMatrix";
import {
  Stack,
  LoadingOverlay,
  Alert,
  Text,
  Paper,
  Divider,
  Group,
  Slider,
  Switch,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface MarkovAnalysisProps {
  tournamentIds: number[];
  includeCut: boolean;
  includeSwiss: boolean;
}

export default function MarkovAnalysis({
  tournamentIds,
  includeCut,
  includeSwiss,
}: MarkovAnalysisProps) {
  const [corpResults, setCorpResults] = useState<MarkovRanking[]>([]);
  const [runnerResults, setRunnerResults] = useState<MarkovRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computationTime, setComputationTime] = useState<number>(0);
  const [iterations, setIterations] = useState<number>(0);
  const [converged, setConverged] = useState<boolean>(true);

  // Alpha smoothing factor controls
  const [alpha, setAlpha] = useState<number>(1.0);

  // Retention multiplier controls
  const [retentionMultiplier, setRetentionMultiplier] = useState<number>(1.0);

  // Cache match data so we can recompute without refetching
  const [cachedMatchData, setCachedMatchData] = useState<any>(null);

  // UI controls
  const showRankingTable = false;


  // Matrix data for flow visualization
  const [corpMatrix, setCorpMatrix] = useState<number[][]>([]);
  const [runnerMatrix, setRunnerMatrix] = useState<number[][]>([]);
  const [corpIdentities, setCorpIdentities] = useState<string[]>([]);
  const [runnerIdentities, setRunnerIdentities] = useState<string[]>([]);
  const [corpPrimaryIdentities, setCorpPrimaryIdentities] = useState<Set<string>>(new Set());
  const [runnerPrimaryIdentities, setRunnerPrimaryIdentities] = useState<Set<string>>(new Set());

  // Matchup data for tooltips
  const [corpMatchupData, setCorpMatchupData] = useState<any[]>([]);
  const [runnerMatchupData, setRunnerMatchupData] = useState<any[]>([]);

  // Function to compute rankings with a given alpha value and retention multiplier
  const computeRankings = (matchData: any, alphaValue: number, retentionValue: number) => {
    const computeStart = performance.now();

    console.time("Markov computation");

    const result = computeDualMarkovRankings(
      matchData.corpData,
      matchData.runnerData,
      matchData.corpMetaShare,
      matchData.runnerMetaShare,
      alphaValue,
      retentionValue
    );

    console.timeEnd("Markov computation");

    const computeEnd = performance.now();
    setComputationTime(computeEnd - computeStart);

    // Update rankings
    setCorpResults(result.corpRankings);
    setRunnerResults(result.runnerRankings);

    // Update matrix data
    setCorpMatrix(result.matrix);
    setRunnerMatrix(result.matrix);
    setCorpIdentities(result.identities);
    setRunnerIdentities(result.identities);
    setCorpPrimaryIdentities(result.corpIdentities);
    setRunnerPrimaryIdentities(result.runnerIdentities);

    // Update iteration info
    setIterations(result.iterations);
    setConverged(result.converged);

    // Update matchup data for tooltips
    setCorpMatchupData(matchData.corpData);
    setRunnerMatchupData(matchData.runnerData);

    // Check if we have insufficient data
    if (result.corpRankings.length === 0 && result.runnerRankings.length === 0) {
      setError(
        "Insufficient data for Markov analysis. Ensure the selected tournaments contain decisive matches (3-0 outcomes)."
      );
    } else {
      setError(null);
    }
  };

  // Fetch data when tournament filters change
  useEffect(() => {
    const fetchAndCompute = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch match data from server
        const matchData = await getMarkovMatchData({
          tournamentIds,
          includeSwiss,
          includeCut,
        });

        setCachedMatchData(matchData);
        computeRankings(matchData, alpha, retentionMultiplier);
      } catch (err) {
        console.error("Error computing Markov rankings:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to compute Markov rankings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAndCompute();
  }, [tournamentIds, includeCut, includeSwiss]);

  // Recompute when alpha or retentionMultiplier changes (instant refresh)
  useEffect(() => {
    if (!cachedMatchData) return;

    computeRankings(cachedMatchData, alpha, retentionMultiplier);
  }, [alpha, retentionMultiplier, cachedMatchData]);

  if (loading) {
    return (
      <Paper pos="relative" mih={200}>
        <LoadingOverlay
          visible={loading}
          overlayProps={{ radius: "sm", blur: 2 }}
        />
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error"
        color="red"
        variant="light"
      >
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Controls */}
      <Stack gap="xs" style={{ maxWidth: 600 }}>
        <Text size="sm" fw={500}>
          Laplace Smoothing Factor (α): {alpha.toFixed(2)}
        </Text>
        <Slider
          value={alpha}
          onChange={setAlpha}
          min={0}
          max={5}
          step={0.1}
          marks={[
            { value: 0, label: "0" },
            { value: 1, label: "1" },
            { value: 2, label: "2" },
            { value: 3, label: "3" },
            { value: 4, label: "4" },
            { value: 5, label: "5" },
          ]}
        />
      </Stack>

      <Stack gap="xs" style={{ maxWidth: 600 }}>
        <Text size="sm" fw={500}>
          Retention Multiplier: {retentionMultiplier.toFixed(2)}
        </Text>
        <Slider
          value={retentionMultiplier}
          onChange={setRetentionMultiplier}
          min={0}
          max={1}
          step={0.05}
          marks={[
            { value: 0, label: "0" },
            { value: 0.25, label: "0.25" },
            { value: 0.5, label: "0.5" },
            { value: 0.75, label: "0.75" },
            { value: 1, label: "1.0" },
          ]}
        />
      </Stack>

      {/* Flow Matrix - single matrix with perspective toggle */}
      {(corpResults.length > 0 || runnerResults.length > 0) && (
        <MarkovFlowMatrix
          matrix={corpMatrix}
          identities={corpIdentities}
          primaryIdentities={corpPrimaryIdentities}
          side="corp"
          rankings={corpResults}
          opponentRankings={runnerResults}
          matchupData={corpMatchupData}
        />
      )}

      {/* Computation info */}
      {(corpResults.length > 0 || runnerResults.length > 0) && (
        <Text size="xs" c="dimmed">
          Computation time: {computationTime.toFixed(0)}ms | {iterations} iterations{!converged && " (not converged)"}
        </Text>
      )}

      {/* Corp rankings */}
      {/* {corpResults.length > 0 && (
        <>
          {showRankingTable && (
            <MarkovRankingChart rankings={corpResults} side="corp" />
          )}
          <MarkovValueChart rankings={corpResults} side="corp" />
        </>
      )} */}

      {/* <Divider /> */}

      {/* Runner rankings */}
      {/* {runnerResults.length > 0 && (
        <>
          {showRankingTable && (
            <MarkovRankingChart rankings={runnerResults} side="runner" />
          )}
          <MarkovValueChart rankings={runnerResults} side="runner" />
        </>
      )} */}

      {/* <Divider /> */}
    </Stack>
  );
}
