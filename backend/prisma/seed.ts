import { PrismaClient } from '@prisma/client';
import { CustomerStatus, CustomerType, MovementType, Role } from '../src/types/enums.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script...');
  const passwordHash = await bcrypt.hash('Demo@12345', 12);

  const userDefs = [
    { name: 'Aarav Mehta', email: 'admin@example.com', role: Role.ADMIN },
    { name: 'Riya Shah', email: 'sales@example.com', role: Role.SALES },
    { name: 'Kabir Singh', email: 'warehouse@example.com', role: Role.WAREHOUSE },
    { name: 'Ananya Iyer', email: 'accounts@example.com', role: Role.ACCOUNTS },
  ];

  const users: any[] = [];
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    users.push(user);
  }

  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  });

  const office = await prisma.category.upsert({
    where: { name: 'Office supplies' },
    update: {},
    create: { name: 'Office supplies' },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { name: 'Central warehouse' },
    update: {},
    create: { name: 'Central warehouse', location: 'Bhiwandi, Mumbai' },
  });

  const productDefs = [
    { name: 'Laptop Stand', sku: 'LS-ALU-001', unitPrice: 1299, currentStock: 34, minimumStock: 12, categoryId: electronics.id, warehouseId: warehouse.id },
    { name: 'Wireless Keyboard', sku: 'WK-109', unitPrice: 1899, currentStock: 8, minimumStock: 10, categoryId: electronics.id, warehouseId: warehouse.id },
    { name: 'Thermal Paper Roll', sku: 'TPR-80', unitPrice: 85, currentStock: 120, minimumStock: 30, categoryId: office.id, warehouseId: warehouse.id },
  ];

  const products: any[] = [];
  for (const p of productDefs) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    products.push(prod);
  }

  const customer = await prisma.customer.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: {
      name: 'Nikhil Kapoor',
      mobile: '9876543210',
      email: 'nikhil@kapoortraders.in',
      businessName: 'Kapoor Traders',
      gstNumber: '27AAECK1234P1ZV',
      type: CustomerType.WHOLESALE,
      status: CustomerStatus.ACTIVE,
      address: 'Andheri East, Mumbai',
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customer.id,
      createdById: users[1].id,
      followUpDate: new Date(Date.now() + 86400000),
      notes: 'Confirm next-month replenishment requirement.',
    },
  });

  const movementCount = await prisma.stockMovement.count();
  if (movementCount === 0) {
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await prisma.stockMovement.create({
        data: {
          productId: p.id,
          quantityChanged: p.currentStock,
          type: MovementType.IN,
          reason: 'Opening stock',
          createdById: users[i % users.length].id,
        },
      });
    }
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
