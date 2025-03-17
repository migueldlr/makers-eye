"use client";

import {
  Button,
  Center,
  Container,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

function parseUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname.includes("aesops")) {
    return ["aesops", parsed.pathname.split("/")[1]];
  }
  if (parsed.hostname.includes("tournaments.nullsignal")) {
    return ["cobra", parsed.pathname.split("/")[2]];
  }
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Container pt="40vh">
      <Center>
        <Stack>
          <TextInput
            label="URL"
            value={value}
            onChange={(e) => {
              setHasError(false);
              setValue(e.target.value);
            }}
            error={hasError}
          />
          <Button
            variant="gradient"
            gradient={{ from: "red", to: "yellow", deg: 30 }}
            loading={loading}
            onClick={() => {
              let parsed = null;
              try {
                parsed = parseUrl(value);
              } catch (error) {
                setHasError(true);
              }
              if (parsed) {
                setLoading(true);
                router.push(`/${parsed[0]}/${parsed[1]}`);
              } else {
                setHasError(true);
              }
            }}
          >
            Go
          </Button>
        </Stack>
      </Center>
    </Container>
  );
}
