/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean all users and group relations before seeding
  await prisma.user.deleteMany({});
  await prisma.$executeRaw`DELETE FROM _UserGroups`;

  // Find language and dayOfWeek (FR/MONDAY)
  const language = await prisma.language.findFirst({ where: { iso: 'FR' } });
  const dayOfWeek = await prisma.dayOfWeek.findFirst({
    where: { name: 'MONDAY' },
  });

  // Find groups
  const superAdminGroup = await prisma.group.findFirst({
    where: { name: 'SUPER_ADMIN' },
  });
  const everyoneGroup = await prisma.group.findFirst({
    where: { name: 'EVERYONE' },
  });
  if (!superAdminGroup || !everyoneGroup) {
    throw new Error('SUPER_ADMIN or EVERYONE group missing.');
  }

  // Create 3 users
  const usersData = [
    {
      email: 'superadmin@dvara.local',
      password: await bcrypt.hash('superadmin123', 10),
      name: 'Super Admin',
      pseudo: 'superadmin',
      languageId: language?.id,
      dayOfWeekId: dayOfWeek?.id,
      groups: {
        connect: [{ id: superAdminGroup.id }, { id: everyoneGroup.id }],
      },
    },
    {
      email: 'user1@dvara.local',
      password: await bcrypt.hash('user1pass', 10),
      name: 'User One',
      pseudo: 'user1',
      languageId: language?.id,
      dayOfWeekId: dayOfWeek?.id,
      groups: {
        connect: [{ id: everyoneGroup.id }],
      },
    },
    {
      email: 'user2@dvara.local',
      password: await bcrypt.hash('user2pass', 10),
      name: 'User Two',
      pseudo: 'user2',
      languageId: language?.id,
      dayOfWeekId: dayOfWeek?.id,
      groups: {
        connect: [{ id: everyoneGroup.id }],
      },
    },
  ];

  for (const userData of usersData) {
    await prisma.user.create({ data: userData });
  }

  console.log(
    'Seeded 3 users: superadmin@dvara.local, user1@dvara.local, user2@dvara.local',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
