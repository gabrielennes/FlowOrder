import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@floworder.com' },
    update: {},
    create: {
      email: 'admin@floworder.com',
      passwordHash,
      name: 'Administrador',
      role: UserRole.ADMIN,
    },
  });

  const warehouseHash = await bcrypt.hash('warehouse123', 10);
  await prisma.user.upsert({
    where: { email: 'warehouse@floworder.com' },
    update: {},
    create: {
      email: 'warehouse@floworder.com',
      passwordHash: warehouseHash,
      name: 'Operador Warehouse',
      role: UserRole.WAREHOUSE,
    },
  });

  const customerHash = await bcrypt.hash('customer123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@floworder.com' },
    update: {},
    create: {
      email: 'customer@floworder.com',
      passwordHash: customerHash,
      name: 'Cliente Demo',
      role: UserRole.CUSTOMER,
    },
  });

  const products = [
    {
      name: 'Notebook Pro 15',
      sku: 'NB-PRO-15',
      price: 4999.9,
      description: 'Notebook para uso profissional',
      stock: 25,
    },
    {
      name: 'Mouse Ergonômico',
      sku: 'MS-ERG-01',
      price: 149.9,
      description: 'Mouse wireless ergonômico',
      stock: 100,
    },
    {
      name: 'Teclado Mecânico',
      sku: 'KB-MEC-RGB',
      price: 399.9,
      description: 'Switch blue, RGB',
      stock: 50,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        description: p.description,
        createdById: admin.id,
        inventory: {
          create: { quantity: p.stock, reservedQuantity: 0 },
        },
      },
    });
  }

  console.log('Seed completed: admin, warehouse, customer + 3 products');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
