import { BackButton } from "@/components/common/BackButton";
import { SITE_TITLE } from "@/lib/util";
import { netrunnerFont } from "@/styles/fonts";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  List,
  ListItem,
  Anchor,
} from "@mantine/core";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Credits | ${SITE_TITLE}`,
};

export default function CreditsPage() {
  return (
    <Container pt="xl" h="100vh">
      <Stack>
        <Group>
          <Title order={1}>
            <span
              className={netrunnerFont.className}
              style={{ verticalAlign: "-7%", marginRight: "-0.1.5em" }}
            >
              
            </span>{" "}
            Credits
          </Title>
        </Group>

        <Text>
          The Maker&apos;s Eye was created as a personal project for me
          (spiderbro) to analyze Netrunner tournament results and the Netrunner
          meta at large. While it is still very much a work in progress, I hope
          it can be of use to the community.
        </Text>

        <Text>
          I would like to thank the following people and projects for their
          contributions to the community and as direct inspiration for The
          Maker&apos;s Eye:
        </Text>
        <List>
          <ListItem>
            <Anchor href="https://tracex.substack.com/">The Surveyor</Anchor>,
            for providing the community a reputable baseline for tournament and
            meta analysis.
          </ListItem>
          <ListItem>
            The authors and maintainers of{" "}
            <Anchor href="https://tournaments.nullsignal.games/">Cobra</Anchor>{" "}
            and{" "}
            <Anchor href="https://www.aesopstables.net/">
              Aesop&apos;s Tables
            </Anchor>
            , for providing open APIs for tournament data.
          </ListItem>
          <ListItem>The kind folks in GLC for providing feedback.</ListItem>
          <ListItem>
            MoM, for their early support and encouragement. Go team!
          </ListItem>
        </List>

        <br />
        <Text>
          If you feel so inclined, you can support me on Ko-fi{" "}
          <Anchor href="https://ko-fi.com/spiderbro">here</Anchor>.
        </Text>

        <Text size="sm" mt="lg">
          Game symbols by Null Signal Games CC BY-ND 4.0. <br />
          <br />
          The information presented on this site about Android: Netrunner, both
          literal and graphical, is copyrighted by Fantasy Flight Games and/or
          Null Signal Games. <br />
          <br />
          This website is not produced, endorsed, supported, or affiliated with
          Fantasy Flight Games or Null Signal Games.
        </Text>
        <BackButton />
      </Stack>
    </Container>
  );
}
