import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

export async function seed() {
  // Supprime d'abord les dashboards de test liés aux users
  await prisma.dashboard.deleteMany({ where: { name: 'Dashboard Test 1' } });
  // Supprime d'abord les sous-modèles enfants de dashboardSettingsAccess
  await prisma.dashboardSettingsAccessUser.deleteMany({});
  await prisma.dashboardSettingsAccessGroup.deleteMany({});
  // Puis dashboardSettingsAccess
  await prisma.dashboardSettingsAccess.deleteMany({});
  // Puis les autres sous-modèles de settings
  await prisma.dashboardSettingsGeneral.deleteMany({});
  await prisma.dashboardSettingsBackground.deleteMany({});
  await prisma.dashboardSettingsLayout.deleteMany({});
  await prisma.dashboardSettingsAppearance.deleteMany({});
  // Puis dashboardSettings (parent)
  await prisma.dashboardSettings.deleteMany({});
  // Puis dashboardContent
  await prisma.dashboardContent.deleteMany({});
  // Supprime les applications de test liées aux users
  await prisma.application.deleteMany({
    where: {
      name: { in: ['App Test 1', 'App Test 2', 'App Test 3'] },
    },
  });
  // Supprime les groupes de test liés aux users
  await prisma.group.deleteMany({ where: { name: 'Test Group 1' } });
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
