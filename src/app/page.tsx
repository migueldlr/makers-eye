"use client";

import LinkToDashboard from "@/components/common/LinkToDashboard";
import FancyLink from "@/components/homepage/FancyLink";
import FancyTitle from "@/components/homepage/FancyTitle";
import FeaturedTournaments from "@/components/homepage/FeaturedTournaments";
import { parseUrl } from "@/lib/util";

import {
  ActionIcon,
  Affix,
  Box,
  Center,
  Container,
  Divider,
  Image,
  LoadingOverlay,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
          placeholder="Cobra / Aesop's URL"
          labelProps={{ style: { textAlign: "right" } }}
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

  return (
    <Container>
      <Center h="100vh">
        <Stack align="center">
          <FancyTitle />
          <Stack gap="xs">
            <Stack align="center">
              {form}
              <FeaturedTournaments />
              <LinkToDashboard />
            </Stack>
            <Divider label="or" mx="xl" />
            <Stack align="center" gap="xs">
              <FancyLink href="/wrapped" extraFancy>
                Wrapped
              </FancyLink>
              <FancyLink href="/stats">Meta analysis</FancyLink>
              <FancyLink href="/faq">FAQ</FancyLink>
              <FancyLink href="/credits">Credits</FancyLink>
            </Stack>
          </Stack>
        </Stack>
      </Center>
      <Affix
        position={{ left: "50vw", bottom: 20 }}
        ml={-100}
        w={200}
        visibleFrom="xs"
      >
        <Center>
          <Text c="gray.7">created by spiderbro</Text>
        </Center>
      </Affix>
      <Affix position={{ right: 10, top: 0 }} zIndex={-10}>
        <Image
          src="/decal-bottomleft.svg"
          style={{
            maxWidth: "40vw",
            pointerEvents: "none",
            userSelect: "none",
            MozUserSelect: "none",
            WebkitUserSelect: "none",
            transform: "rotate(180deg)",
            maskImage:
              "linear-gradient(30deg, rgba(0,0,0,0.9), rgba(0,0,0,0.0))",
            WebkitMaskImage:
              "linear-gradient(30deg, rgba(0,0,0,0.9), rgba(0,0,0,0.0))",
          }}
        />
      </Affix>
      <Affix position={{ left: 10, bottom: 0 }} zIndex={-10}>
        <Image
          src="/decal-bottomleft.svg"
          style={{
            maxWidth: "40vw",
            pointerEvents: "none",
            userSelect: "none",
            MozUserSelect: "none",
            WebkitUserSelect: "none",
            maskImage:
              "linear-gradient(30deg, rgba(0,0,0,0.9), rgba(0,0,0,0.0))",
            WebkitMaskImage:
              "linear-gradient(30deg, rgba(0,0,0,0.9), rgba(0,0,0,0.0))",
          }}
        />
      </Affix>
    </Container>
  );
}
