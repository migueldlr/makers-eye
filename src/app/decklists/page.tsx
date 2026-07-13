import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { Text } from "@mantine/core";
import { getCatalogEventSummaries } from "@/lib/catalog/queries";
import { CatalogClient } from "./CatalogClient";
import styles from "./catalog.module.css";

export const metadata = {
  title: "Tournament decklists | The Maker's Eye",
  description: "Tournament top cuts, standings, and submitted Netrunner decklists.",
};

// Render on every request so newly imported/published events show up
// immediately, without a cache to invalidate.
export const dynamic = "force-dynamic";

export default async function DecklistCatalogPage() {
  const events = await getCatalogEventSummaries();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/">
          <IconChevronLeft size={15} aria-hidden="true" /> Home
        </Link>
        <header className={styles.hero}>
          <h1 className={styles.title}>Tournament decklists</h1>
        </header>
        {events.length === 0 ? (
          <div className={styles.empty}>
            <Text fw={600}>No tournaments published yet</Text>
            <Text size="sm" mt={6}>
              Published tournaments will show up here.
            </Text>
          </div>
        ) : (
          <CatalogClient events={events} />
        )}
      </div>
    </main>
  );
}
