import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userUsername = process.env.SEED_USER_USERNAME;
  const userPassword = process.env.SEED_USER_PASSWORD;

  if (!adminUsername || !adminPassword || !userUsername || !userPassword) {
    throw new Error('Set SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD, SEED_USER_USERNAME, and SEED_USER_PASSWORD before running the seed.');
  }

  const account = await db.account.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Kos Manager' },
  });

  const users = [
    { username: adminUsername, password: adminPassword, owner: true, firstName: 'Admin', lastName: '' },
    { username: userUsername, password: userPassword, owner: false, firstName: 'User', lastName: '' },
  ];

  for (const item of users) {
    await db.user.upsert({
      where: { email: item.username.toLowerCase() },
      update: {
        password: await bcrypt.hash(item.password, 12),
        owner: item.owner,
        firstName: item.firstName,
        lastName: item.lastName,
        deletedAt: null,
        accountId: account.id,
      },
      create: {
        accountId: account.id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.username.toLowerCase(),
        password: await bcrypt.hash(item.password, 12),
        owner: item.owner,
      },
    });
  }

  console.log('Demo accounts seeded.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => db.$disconnect());
