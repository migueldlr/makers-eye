"use client";

import { Tabs } from "@mantine/core";
import { ReactNode, useEffect, useState } from "react";
import classes from "./SideTabs.module.css";

function ownerOf(id: string) {
  if (id.startsWith("runner-")) return "runner";
  if (id.startsWith("corp-")) return "corp";
  return null;
}

/**
 * Corp and Runner sections are parallel, so they are tabbed rather than
 * stacked. Both panels stay mounted (keepMounted) so the charts in the
 * inactive tab keep their loaded state when switching back and forth.
 */
export default function SideTabs({
  corp,
  runner,
}: {
  corp: ReactNode;
  runner: ReactNode;
}) {
  const [side, setSide] = useState<string | null>("corp");
  // Deep link target waiting to be scrolled to once its tab is visible.
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null);

  useEffect(() => {
    const syncToHash = () => {
      const id = window.location.hash.slice(1);
      const owner = id ? ownerOf(id) : null;
      if (!owner) return;

      setSide(owner);
      setPendingAnchor(id);
    };

    syncToHash();
    window.addEventListener("hashchange", syncToHash);
    return () => window.removeEventListener("hashchange", syncToHash);
  }, []);

  // The inactive panel is hidden, so scrolling can only happen after the tab
  // switch has been committed and the target is actually laid out.
  useEffect(() => {
    if (pendingAnchor == null) return;

    document.getElementById(pendingAnchor)?.scrollIntoView();
    setPendingAnchor(null);
  }, [pendingAnchor, side]);

  return (
    <Tabs variant="outline" value={side} onChange={setSide} keepMounted mb="xl">
      <Tabs.List mb="lg" grow>
        <Tabs.Tab value="corp" color="blue" className={classes.tab}>
          Corp
        </Tabs.Tab>
        <Tabs.Tab value="runner" color="red" className={classes.tab}>
          Runner
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="corp">{corp}</Tabs.Panel>
      <Tabs.Panel value="runner">{runner}</Tabs.Panel>
    </Tabs>
  );
}
