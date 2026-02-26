import { netrunnerFont } from "@/styles/fonts";
import { Box, Button, Center, Text } from "@mantine/core";
import { IconConfetti } from "@tabler/icons-react";
import { VT323 } from "next/font/google";
import Link from "next/link";
import { PropsWithChildren } from "react";

const vt323 = VT323({ weight: "400", subsets: ["latin"] });

export default function FancyLink({
  href,
  children,
  extraFancy = false,
  isScoop = false,
}: PropsWithChildren<{
  href: string;
  extraFancy?: boolean;
  isScoop?: boolean;
}>) {
  return (
    <Box w={isScoop ? 230 : 210}>
      <Center>
        <Button
          component={Link}
          href={href}
          variant={extraFancy ? "gradient" : "outline"}
          gradient={{ from: "pink", to: "yellow", deg: 150 }}
          leftSection={extraFancy && <IconConfetti size={16} />}
          rightSection={extraFancy && <IconConfetti size={16} />}
          color={isScoop ? "white" : "orange"}
          styles={
            isScoop
              ? {
                  root: { overflow: "visible" },
                  inner: { overflow: "visible" },
                  label: { overflow: "visible" },
                }
              : undefined
          }
        >
          <Text className={netrunnerFont.className} size="14">
            
          </Text>
          :{" "}
          {isScoop ? (
            <Text
              span
              className={vt323.className}
              size="xl"
              ml={4}
              style={{
                textShadow: "0 0 3px rgba(255,255,255,0.75)",
              }}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Button>
      </Center>
    </Box>
  );
}
