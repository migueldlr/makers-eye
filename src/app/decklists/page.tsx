import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { Text } from "@mantine/core";
import { getCachedCatalogEventSummaries } from "@/lib/catalog/queries";
import { CatalogClient } from "./CatalogClient";
import styles from "./catalog.module.css";

export const metadata = {
  title: "Tournament decklists | The Maker's Eye",
  description: "Tournament top cuts, standings, and submitted Netrunner decklists.",
};

export default async function DecklistCatalogPage() {
  const events = await getCachedCatalogEventSummaries();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/">
          <IconChevronLeft size={15} aria-hidden="true" /> Home
        </Link>
        <header className={styles.hero}>
          <div className={styles.eyebrow}>The Maker&apos;s Eye / Tournament ledger</div>
          <h1 className={styles.title}>Every top cut. One page.</h1>
          <Text className={styles.lede}>
            Search every published event and top-cut player. Submitted Corp and
            Runner lists open from the ledger when available.
          </Text>
        </header>
        {events.length === 0 ? (
          <div className={styles.empty} style={{ marginTop: 30 }}>
            <Text fw={650}>No events have been published yet.</Text>
            <Text size="sm" mt={6}>
              Reviewed tournaments will appear here.
            </Text>
          </div>
        ) : (
          <CatalogClient events={events} />
        )}
      </div>
    </main>
  );
}
