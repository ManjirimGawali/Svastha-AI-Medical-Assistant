import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pgPool);

// Shared singleton — import this instead of constructing PrismaClient per-service
export const prisma = new PrismaClient({ adapter: prismaAdapter });
