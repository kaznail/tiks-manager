import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminCode = '20192019';
  const hashedCode = await bcrypt.hash(adminCode, 10);

  // Check if admin exists to avoid duplicate seed runs
  const existingAdmin = await prisma.admin.findFirst();

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        adminCodeHash: hashedCode,
      },
    });
    console.log('✅ Admin initialized successfully with code 20192019');
  } else {
    console.log('ℹ️ Admin already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
