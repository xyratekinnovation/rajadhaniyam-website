import { PrismaClient } from "@prisma/client";

// Standard singleton pattern so dev hot-reload doesn't exhaust DB connections.
// The client is lazy — no connection is opened until the first query runs,
// so importing this module is safe even without a real DATABASE_URL yet.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
