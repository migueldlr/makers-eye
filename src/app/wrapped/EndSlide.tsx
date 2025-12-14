"use client";

import { BackButton } from "@/components/common/BackButton";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import Slide from "./Slide";

interface EndSlideProps {
  onReset: () => void;
}

export default function EndSlide({ onReset }: EndSlideProps) {
  return (
    <Slide gradient="linear-gradient(135deg,rgb(11, 10, 11),rgb(37, 33, 33))">
      <Stack align="center" gap="md">
        <Title order={1} ta="center">
          That's all for now, see you next year!
        </Title>
        <Group justify="center">
          <Button
            variant="gradient"
            gradient={{ from: "pink", to: "orange" }}
            onClick={onReset}
          >
            Upload another JSON
          </Button>
          <BackButton />
        </Group>
      </Stack>
    </Slide>
  );
}
