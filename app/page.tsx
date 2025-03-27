"use client";

import LinkToDashboard from "@/components/LinkToDashboard";
import { parseUrl } from "@/lib/util";
import {
  ActionIcon,
  Affix,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Loader,
  LoadingOverlay,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconEye, IconEyeSearch, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const FancyTitle = () => (
  <Stack align="center" gap={0}>
    <Title order={1}>
      <Text
        inherit
        fw={900}
        variant="gradient"
        gradient={{ from: "red", to: "yellow", deg: 30 }}
      >
        The Maker's Eye
      </Text>
    </Title>
    <Title order={4}>Netrunner tournament and meta analysis</Title>
  </Stack>
);

export default function HomePage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const go = () => {
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
  };

  const form = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <Box pos="relative">
        <TextInput
          color="orange"
          placeholder="Tournament URL"
          labelProps={{ align: "right" }}
          value={value}
          onChange={(e) => {
            setHasError(false);
            setValue(e.target.value);
          }}
          disabled={loading}
          onSubmit={() => go()}
          ref={ref}
          error={hasError}
          rightSection={
            loading ? (
              <Loader size="xs" color="white" />
            ) : (
              <ActionIcon
                size={24}
                variant="gradient"
                gradient={{ from: "red", to: "yellow", deg: 30 }}
                onClick={() => go()}
              >
                <IconEye style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            )
          }
        />
      </Box>
    </form>
  );

  const width = 250;

  return (
    <Container>
      <Center h="100vh">
        <Stack align="center">
          <FancyTitle />
          <Space h="xl" />
          <Stack gap="xs">
            <Stack align="center">
              {form}
              <LinkToDashboard />
            </Stack>
            <Divider label="or" my="sm" />
            <Stack align="center">
              <Button
                component={Link}
                href="/stats"
                variant="outline"
                color="orange"
                // gradient={{ from: "cyan", to: "teal", deg: 90 }}
              >
                Breach
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Center>
      <Affix position={{ left: "50vw", bottom: 20 }} ml={-100} w={200}>
        <Center>
          <Text c="gray.7">created by spiderbro</Text>
        </Center>
      </Affix>
    </Container>
  );
}
