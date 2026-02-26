import dotenv from "dotenv";
dotenv.config();

import { seed } from "../src/db/seed";

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
