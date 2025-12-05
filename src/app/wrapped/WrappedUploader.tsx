"use client";

import { BackButton } from "@/components/common/BackButton";
import { summarizeUpload } from "@/lib/wrapped/processing";
import type { UploadSummary } from "@/lib/wrapped/types";
import { Alert, Container, FileInput, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import WrappedStats from "./WrappedStats";

const WRAPPED_CACHE_DB = "wrappedUploadCache";
const WRAPPED_CACHE_VERSION = 1;
const WRAPPED_CACHE_STORE = "uploads";
const WRAPPED_CACHE_KEY = "latestUpload";

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

    try {
      const content = await uploaded.text();
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
    <UploadScreen file={file} error={error} onFileChange={handleFileChange} />
  );
}

interface UploadScreenProps {
  file: File | null;
  error: string | null;
  onFileChange: (file: File | null) => void;
}

function UploadScreen({ file, error, onFileChange }: UploadScreenProps) {
  return (
    <Container pt="xl" pb="4xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>JNET Wrapped</Title>
        </Stack>

        <Stack gap="md">
          <FileInput
            variant="filled"
            value={file}
            onChange={onFileChange}
            accept="application/json,.json"
            placeholder="Click to upload a JSON file"
            size="xl"
            clearable
          />

          {error && <Alert color="red">{error}</Alert>}
        </Stack>

        <BackButton />
      </Stack>
    </Container>
  );
}
