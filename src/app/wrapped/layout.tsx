import { SITE_TITLE } from "@/lib/util";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Jnet Wrapped | ${SITE_TITLE}`,
};

export default function WrappedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
