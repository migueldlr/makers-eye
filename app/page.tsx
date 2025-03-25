"use client";

import LinkToDashboard from "@/components/LinkToDashboard";
import { parseUrl } from "@/lib/util";
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
            label="Tournament URL"
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
          <LinkToDashboard />
          <Center>
            <Text mt="43vh" c="gray.7">
              created by spiderbro
            </Text>
          </Center>
        </Stack>
      </Center>
    </Container>
  );
}
