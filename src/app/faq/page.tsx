import { BackButton } from "@/components/common/BackButton";
import { SITE_TITLE } from "@/lib/util";
import { Container, Stack, Title, Text, Box, Anchor } from "@mantine/core";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `FAQ | ${SITE_TITLE}`,
};

export default async function FaqPage() {
  return (
    <Container pt="xl">
      <Stack gap="lg">
        <Title order={1}>FAQ</Title>
        <Title order={3}>What is this?</Title>
        <Text>
          The Maker&#39;s Eye is a Netrunner tournament and meta analysis tool.
        </Text>
        <Title order={3}>
          How do I look at stats from a single tournament?
        </Title>
        <Text>
          From the homepage, paste in a link from Cobra or Aesop&#39;s and click
          the eye.
        </Text>
        <Title order={3}>Can I view a tournament in progress?</Title>
        <Text>
          Yes! In fact, that&#39;s one of the ways I intended to use this tool
          personally, to help me scout opponents for large tournaments. In
          progress tournaments are not guaranteed to show the most up-to-date
          game results.
        </Text>
        <Title order={3}>What is cut conversion?</Title>
        <Text>
          Cut conversion represents a given identity&#39;s rate of making the
          top cut after swiss relative to an expected baseline. It is expressed
          as a ratio, not a percentage. The Surveyor has a good writeup about it{" "}
          <Anchor href="https://tracex.substack.com/i/149874256/about-the-cut-conversion-metric">
            here
          </Anchor>
          .
        </Text>
        <Title order={3}>
          Why are some tournaments missing in the meta analysis?
        </Title>
        <Text>
          There may be several factors, but a tournament may not be competitive
          or have enough participants. Additionally, uploading results is a
          manual process.
        </Text>
      </Stack>
      <Box mt="xl">
        <BackButton />
      </Box>
    </Container>
  );
}
