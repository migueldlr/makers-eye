import { netrunnerFont } from "@/styles/fonts";
import { Box, Button, Center, Text } from "@mantine/core";
import { IconConfetti } from "@tabler/icons-react";
import Link from "next/link";
import { PropsWithChildren } from "react";

export default function FancyLink({
  href,
  children,
  extraFancy = false,
}: PropsWithChildren<{ href: string; extraFancy?: boolean }>) {
  return (
    <Box w={210}>
      <Center>
        <Button
          component={Link}
          href={href}
          variant={extraFancy ? "gradient" : "outline"}
          gradient={{ from: "pink", to: "yellow", deg: 150 }}
          leftSection={extraFancy && <IconConfetti size={16} />}
          rightSection={extraFancy && <IconConfetti size={16} />}
          color="orange"
        >
          <Text className={netrunnerFont.className} size="14">
            
          </Text>
          : {children}
        </Button>
      </Center>
    </Box>
  );
}
