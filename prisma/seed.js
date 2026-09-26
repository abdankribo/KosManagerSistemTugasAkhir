import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userUsername = process.env.SEED_USER_USERNAME;
  const userPassword = process.env.SEED_USER_PASSWORD;
  const tenantUsername = process.env.SEED_TENANT_USERNAME;
  const tenantPassword = process.env.SEED_TENANT_PASSWORD;

  if (!adminUsername || !adminPassword || !userUsername || !userPassword) {
    throw new Error('Set SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD, SEED_USER_USERNAME, and SEED_USER_PASSWORD before running the seed.');
  }

  const account = await db.account.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Kos Manager' },
  });

  const users = [
    { username: adminUsername, password: adminPassword, role: 'ADMIN', owner: true, firstName: 'Admin', lastName: '', renterId: null },
    { username: userUsername, password: userPassword, role: 'STAFF', owner: false, firstName: 'User', lastName: '', renterId: null },
  ];

  if (tenantUsername && tenantPassword) {
    let renter = await db.renter.findFirst({ where: { name: 'Demo Penyewa', deletedAt: null } });
    if (!renter) {
      renter = await db.renter.create({
        data: {
          nik: '0000000000000000',
          name: 'Demo Penyewa',
          gender: 'Laki-Laki',
          phoneNumber: '081234567890',
          address: 'Data demo tenant',
        },
      });
    }
    users.push({
      username: tenantUsername,
      password: tenantPassword,
      role: 'TENANT',
      owner: false,
      firstName: 'Penyewa',
      lastName: 'Demo',
      renterId: renter.id,
    });
  }

  for (const item of users) {
    await db.user.upsert({
      where: { email: item.username.toLowerCase() },
      update: {
        password: await bcrypt.hash(item.password, 12),
        owner: item.owner,
        role: item.role,
        renterId: item.renterId,
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
        role: item.role,
        renterId: item.renterId,
      },
    });
  }

  // Demo inventory: 10 additional rooms, split into two monthly price tiers.
  // Room numbers 102-106 are Rp1.000.000/month; 107-111 are Rp2.000.000/month.
  const demoRooms = [
    ...Array.from({ length: 5 }, (_, i) => ({ number: String(102 + i), costPerMonth: 1000000 })),
    ...Array.from({ length: 5 }, (_, i) => ({ number: String(107 + i), costPerMonth: 2000000 })),
  ];
  for (const room of demoRooms) {
    const existing = await db.room.findFirst({ where: { number: room.number } });
    if (existing) {
      await db.room.update({
        where: { id: existing.id },
        data: { length: 3, width: 4, costPerMonth: room.costPerMonth, deletedAt: null },
      });
    } else {
      await db.room.create({
        data: { number: room.number, length: 3, width: 4, costPerMonth: room.costPerMonth, facilities: 'Bed' },
      });
    }
  }

  console.log('Demo accounts seeded.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => db.$disconnect());