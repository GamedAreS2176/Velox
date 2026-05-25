import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserHoldings(userId: string) {
  // Return all holdings for the user (ownership enforced in WHERE)
  return prisma.holding.findMany({ where: { userId } });
}

export async function getHoldingById(id: string, userId: string) {
  // Enforce ownership at query level
  return prisma.holding.findFirst({ where: { id, userId } });
}

export async function createHolding(userId: string, symbol: string, units: Prisma.Decimal | number | string) {
  try {
    const created = await prisma.holding.create({
      data: {
        userId,
        symbol,
        units: units as any
      }
    });
    return created;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const field = (e.meta as any)?.target || 'unique constraint';
      const conflictError = new Error(`A record with this ${field} already exists.`);
      (conflictError as any).statusCode = 409;
      throw conflictError;
    }
    throw e;
  }
}

export async function updateHolding(id: string, userId: string, data: Prisma.HoldingUpdateInput) {
  // Use updateMany to enforce ownership in the WHERE clause (DB-centric)
  const result = await prisma.holding.updateMany({ where: { id, userId }, data });
  if (result.count === 0) {
    const err = new Error('Holding not found or unauthorized');
    (err as any).statusCode = 404;
    throw err;
  }

  // Return the updated record
  return prisma.holding.findFirst({ where: { id, userId } });
}

export async function deleteHolding(id: string, userId: string) {
  const result = await prisma.holding.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    const err = new Error('Holding not found or unauthorized');
    (err as any).statusCode = 404;
    throw err;
  }
  return { deleted: result.count };
}
