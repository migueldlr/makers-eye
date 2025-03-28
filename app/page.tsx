"use client";

import LinkToDashboard from "@/components/LinkToDashboard";
import { parseUrl } from "@/lib/util";
import { netrunnerFont } from "@/styles/fonts";
import {
  ActionIcon,
  Affix,
  Box,
  Button,
  Center,
  Container,
  Divider,
  LoadingOverlay,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
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
        gradient={{ from: "orange", to: "yellow", deg: 30 }}
      >
        The Maker&#39;s Eye
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
        <LoadingOverlay
          visible={loading}
          loaderProps={{ size: "sm", type: "dots", color: "orange" }}
          overlayProps={{
            radius: "sm",
            color: "black",
            backgroundOpacity: 0.2,
          }}
        />
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
            loading ? null : (
              <ActionIcon
                size={24}
                variant="gradient"
                gradient={{ from: "orange", to: "yellow", deg: 30 }}
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
          <Stack gap="xs">
            <Stack align="center">
              {form}
              <LinkToDashboard />
            </Stack>
            <Divider label="or" mx="xl" />
            <Stack align="center" gap="xs">
              <Button
                component={Link}
                href="/stats"
                variant="outline"
                color="orange"
              >
                <Text className={netrunnerFont.className} size="14">
                  
                </Text>
                : Run
              </Button>
              <Button
                component={Link}
                href="/credits"
                variant="outline"
                color="orange"
              >
                <Text className={netrunnerFont.className} size="14">
                  
                </Text>
                : Gain 1
                <Text className={netrunnerFont.className} size="14">
                  
                </Text>
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
