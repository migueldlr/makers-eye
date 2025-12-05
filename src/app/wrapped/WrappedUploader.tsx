"use client";

import { BackButton } from "@/components/common/BackButton";
import { summarizeUpload } from "@/lib/wrapped/processing";
import type { UploadSummary } from "@/lib/wrapped/types";
import {
  Alert,
  Container,
  FileInput,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useState } from "react";
import WrappedStats from "./WrappedStats";

export default function WrappedUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [filterRange, setFilterRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const handleFileChange = async (uploaded: File | null) => {
    setFile(uploaded);
    setFileName(uploaded?.name ?? null);
    setError(null);
    setSummary(null);

    if (!uploaded) {
      return;
    }

    try {
      const content = await uploaded.text();
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const parsedSummary = summarizeUpload(content, {
        start: startOfYear,
        end: now,
      });
      setSummary(parsedSummary);
      setFilterRange({ start: startOfYear, end: now });
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
  };

  if (summary) {
    return (
      <WrappedStats
        summary={summary}
        fileName={fileName}
        filterRange={filterRange}
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
