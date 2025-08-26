import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { tournaments as tournamentsTable } from "./db/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const tournaments = await db.select().from(tournamentsTable);

  console.log(tournaments);
}

main();
