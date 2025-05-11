import { PrismaClient } from '@generated/prisma';

// Prevent multiple instances of Prisma Client in development
declare global {
	// eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;
