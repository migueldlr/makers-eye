"use client";

import { Anchor, Stack, Text, Title } from "@mantine/core";
import Slide from "./Slide";

export default function CreditsSlide() {
  return (
    <Slide>
      <Stack align="center" gap="sm">
        <Title order={1} ta="center">
          Credits
        </Title>
        <Title order={4} ta="center">
          (aka spiderbro&apos;s soapbox)
        </Title>
        <Text size="lg" ta="center">
          Card images and faction icons from NetrunnerDB.
        </Text>
        <Text size="lg" ta="center">
          Thank you to the jinteki.net devs for building an amazing platform for
          helping this community to thrive online. Thank you to Lucy for the
          original JNet Stats Lab, and for providing reassurance that there&apos;s
          &ldquo;no monopoly on good ideas&rdquo;. Thank you to my team, MoM, for poking
          around this site before its official release and providing feedback.
          Go team!
        </Text>
        <Text size="lg" ta="center">
          I can&apos;t thank everyone enough for supporting The Maker&apos;s Eye. It&apos;s an
          honor to be a part of the Netrunner community, and I&apos;m glad I can
          contribute to it in some small way. I hope your 2025 was as rewarding
          as mine was. Be safe, be kind to yourselves and one another (yes, that
          means you, jnet #general), and see you in the new year!
        </Text>
      </Stack>
    </Slide>
  );
}
