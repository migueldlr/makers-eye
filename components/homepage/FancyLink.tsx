import { netrunnerFont } from "@/styles/fonts";
import { Box, Button, Center, Text } from "@mantine/core";
import Link from "next/link";
import { PropsWithChildren } from "react";

export default function FancyLink({
  href,
  children,
}: PropsWithChildren<{ href: string }>) {
  return (
    <Box w={210}>
      <Center>
        <Button component={Link} href={href} variant="outline" color="orange">
          <Text className={netrunnerFont.className} size="14">
            
          </Text>
          : {children}
        </Button>
      </Center>
    </Box>
  );
}
