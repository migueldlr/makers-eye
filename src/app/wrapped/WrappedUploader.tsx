"use client";

import { BackButton } from "@/components/common/BackButton";
import { summarizeUpload } from "@/lib/wrapped/processing";
import type { UploadSummary } from "@/lib/wrapped/types";
import {
  Alert,
  Box,
  Container,
  FileInput,
  LoadingOverlay,
  Stack,
  Title,
  Text,
  Anchor,
  List,
  ListItem,
} from "@mantine/core";
import { useEffect, useState } from "react";
import WrappedStats from "./WrappedStats";

const WRAPPED_CACHE_DB = "wrappedUploadCache";
const WRAPPED_CACHE_VERSION = 1;
const WRAPPED_CACHE_STORE = "uploads";
const WRAPPED_CACHE_KEY = "latestUpload";

/**
 * Validates that the parsed JSON has the expected shape for jnet game history.
 * Returns an error message if invalid, or null if valid.
 */
function validateGameHistoryJson(data: unknown): string | null {
  if (!Array.isArray(data)) {
    return "Invalid format: Expected an array of game records.";
  }

  if (data.length === 0) {
    return "No game records found in the uploaded file.";
  }

  // Check the first few records for expected structure
  const samplesToCheck = Math.min(data.length, 5);
  for (let i = 0; i < samplesToCheck; i++) {
    const record = data[i];
    if (typeof record !== "object" || record === null) {
      return `Invalid format: Record ${i + 1} is not an object.`;
    }

    // Check for at least some expected jnet fields
    const hasRunner = "runner" in record;
    const hasCorp = "corp" in record;
    const hasWinner = "winner" in record;
    const hasEndDate = "end-date" in record;
    const hasStartDate = "start-date" in record;

    if (!hasRunner && !hasCorp) {
      return `Invalid format: Record ${
        i + 1
      } is missing 'runner' and 'corp' fields. This doesn't look like a jnet game history export.`;
    }

    if (!hasWinner && !hasEndDate && !hasStartDate) {
      return `Invalid format: Record ${
        i + 1
      } is missing expected game fields (winner, end-date, start-date). This doesn't look like a jnet game history export.`;
    }
  }

  return null;
}

type CachedState = {
  summary: UploadSummary;
  filterRange: { start: Date; end: Date };
  fileName: string | null;
};

type CachedUploadPayload = {
  content: string;
  fileName: string | null;
};

function buildSummaryState(content: string, name: string | null): CachedState {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const parsedSummary = summarizeUpload(content, {
    start: startOfYear,
    end: now,
  });
  return {
    summary: parsedSummary,
    filterRange: { start: startOfYear, end: now },
    fileName: name,
  };
}

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }
    const request = window.indexedDB.open(
      WRAPPED_CACHE_DB,
      WRAPPED_CACHE_VERSION
    );
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WRAPPED_CACHE_STORE)) {
        db.createObjectStore(WRAPPED_CACHE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open cache database."));
  });
}

async function readCachedUpload(): Promise<CachedUploadPayload | null> {
  const db = await openCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WRAPPED_CACHE_STORE, "readonly");
    const store = tx.objectStore(WRAPPED_CACHE_STORE);
    const request = store.get(WRAPPED_CACHE_KEY);

    request.onsuccess = () => {
      resolve((request.result as CachedUploadPayload | undefined) ?? null);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to read cached upload."));

    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Failed to read cached upload."));
    };
  });
}

async function writeCachedUpload(payload: CachedUploadPayload): Promise<void> {
  const db = await openCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WRAPPED_CACHE_STORE, "readwrite");
    const store = tx.objectStore(WRAPPED_CACHE_STORE);
    const request = store.put(payload, WRAPPED_CACHE_KEY);

    request.onerror = () =>
      reject(request.error ?? new Error("Failed to cache upload."));

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Failed to cache upload."));
    };
  });
}

async function clearCachedUpload(): Promise<void> {
  try {
    const db = await openCacheDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(WRAPPED_CACHE_STORE, "readwrite");
      const store = tx.objectStore(WRAPPED_CACHE_STORE);
      store.delete(WRAPPED_CACHE_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Failed to clear cached upload."));
      };
    });
  } catch (err) {
    // Ignore errors caused by missing IndexedDB support.
    if (err instanceof Error && /IndexedDB/.test(err.message)) {
      return;
    }
    throw err;
  }
}

export default function WrappedUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [filterRange, setFilterRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [cacheWarning, setCacheWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let canceled = false;

    const hydrateFromCache = async () => {
      try {
        const cached = await readCachedUpload();
        if (!cached || canceled) return;
        const result = buildSummaryState(
          cached.content,
          cached.fileName ?? "Cached upload"
        );
        setSummary(result.summary);
        setFilterRange(result.filterRange);
        setFileName(result.fileName);
        setCacheWarning(null);
      } catch (storageError) {
        if (canceled) return;
        await clearCachedUpload();
        setCacheWarning(
          storageError instanceof Error
            ? `Cached data was unavailable and has been cleared: ${storageError.message}`
            : "Cached data was unavailable and has been cleared."
        );
      }
    };

    hydrateFromCache();

    return () => {
      canceled = true;
    };
  }, []);

  const processContent = (content: string, name: string | null) => {
    const result = buildSummaryState(content, name);
    setSummary(result.summary);
    setFilterRange(result.filterRange);
    setFileName(result.fileName);
    setCacheWarning(null);
    return result;
  };

  const handleFileChange = async (uploaded: File | null) => {
    setFile(uploaded);
    setFileName(uploaded?.name ?? null);
    setError(null);

    if (!uploaded) {
      return;
    }

    setLoading(true);

    try {
      const content = await uploaded.text();

      // Validate the JSON structure before processing
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        setError("Invalid JSON: The file could not be parsed.");
        setLoading(false);
        return;
      }

      const validationError = validateGameHistoryJson(parsed);
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      processContent(content, uploaded.name ?? null);
      if (typeof window !== "undefined") {
        try {
          await writeCachedUpload({
            content,
            fileName: uploaded.name ?? null,
          });
        } catch (storageError) {
          setCacheWarning(
            storageError instanceof Error
              ? `Unable to cache upload (storage limit?). Data will reset on refresh. ${storageError.message}`
              : "Unable to cache upload. Data will reset on refresh."
          );
          console.warn("Failed to cache wrapped data", storageError);
        }
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Please upload a valid JSON export.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSummary(null);
    setFile(null);
    setFileName(null);
    setError(null);
    setFilterRange(null);
    setCacheWarning(null);
    if (typeof window !== "undefined") {
      void clearCachedUpload();
    }
  };

  if (summary) {
    return (
      <WrappedStats
        summary={summary}
        fileName={fileName}
        filterRange={filterRange}
        cacheWarning={cacheWarning}
        onReset={handleReset}
      />
    );
  }

  return (
    <UploadScreen
      file={file}
      error={error}
      loading={loading}
      onFileChange={handleFileChange}
    />
  );
}

interface UploadScreenProps {
  file: File | null;
  error: string | null;
  loading: boolean;
  onFileChange: (file: File | null) => void;
}

function UploadScreen({
  file,
  error,
  loading,
  onFileChange,
}: UploadScreenProps) {
  return (
    <Container pt="xl" pb="4xl">
      <Stack gap="lg">
        <Title order={1}>JNET Wrapped</Title>
        <List type="ordered" size="xl">
          <ListItem>
            Follow instructions from Lucy's{" "}
            <Anchor
              href="https://jnet-stats.nro.run/"
              target="_blank"
              size="xl"
            >
              JNet Stats Lab
            </Anchor>{" "}
            to get your game_history.json
          </ListItem>
          <ListItem>Upload your game_history.json below:</ListItem>
        </List>

        <Stack gap="md">
          <Box pos="relative">
            <LoadingOverlay visible={loading} />
            <FileInput
              value={file}
              onChange={onFileChange}
              accept="application/json,.json"
              placeholder="Click to upload"
              size="xl"
              clearable
              disabled={loading}
            />
          </Box>

          {error && <Alert color="red">{error}</Alert>}
        </Stack>

        <Text size="lg" c="gray.5">
          Note: Your game_history.json is stored in your browser's local storage
          for convenience. It is not sent to any servers and can be cleared
          after upload.
        </Text>

        <BackButton />
      </Stack>
    </Container>
  );
}
