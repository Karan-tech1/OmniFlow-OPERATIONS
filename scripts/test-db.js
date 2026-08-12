import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to Prisma database!');
    const users = await prisma.user.findMany();
    console.log('User count:', users.length);
    const products = await prisma.product.findMany();
    console.log('Product count:', products.length);
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
