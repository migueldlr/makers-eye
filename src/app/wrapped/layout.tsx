import { SITE_TITLE } from "@/lib/util";
import { MantineProvider, createTheme } from "@mantine/core";
import type { Metadata } from "next";
import { Chakra_Petch } from "next/font/google";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Jnet Wrapped | ${SITE_TITLE}`,
};

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-wrapped",
});

const wrappedTheme = createTheme({
  fontFamily: chakraPetch.style.fontFamily,
  headings: {
    fontFamily: "inherit",
  },
});

export default function WrappedLayout({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={wrappedTheme}>
      <div className={chakraPetch.className}>{children}</div>
    </MantineProvider>
  );
}
