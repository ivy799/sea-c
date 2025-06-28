import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Use server-side environment variable instead of NEXT_PUBLIC_
const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL!;

const sql = neon(connectionString);

export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === "development"
});