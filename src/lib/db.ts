import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Create a single PrismaClient instance with connection reuse and pooling
// This ensures efficient database connections across the application
const prismaClient = global.prismaGlobal || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prismaClient;
}

// Export as 'prisma' (preferred) and 'db' (for backward compatibility)
export const prisma = prismaClient;
export const db = prismaClient; // Alias for backward compatibility

// Default export
export default prisma;


