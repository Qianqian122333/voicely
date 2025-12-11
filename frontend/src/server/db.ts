import { env } from "~/env";
import { PrismaClient } from "@prisma/client";

const createPrismaClient = () =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const db = globalForPrisma.prisma ?? createPrismaClient();

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
