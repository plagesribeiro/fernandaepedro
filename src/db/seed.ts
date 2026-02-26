import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { gifts } from "./schema";
import seedData from "../data/gifts-seed.json";

export async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding gifts...");

  for (const gift of seedData) {
    await db.insert(gifts).values({
      name: gift.name,
      description: gift.description,
      imageUrl: gift.imageUrl,
      price: gift.price.toString(),
      category: gift.category,
      totalQuantity: gift.totalQuantity,
      reservedQuantity: 0,
    });
    console.log(`  ✓ ${gift.name}`);
  }

  console.log(`\nSeeded ${seedData.length} gifts successfully!`);
}
