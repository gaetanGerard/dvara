import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  // Récupère un utilisateur lambda (user1)
  const user = await prisma.user.findFirst({
    where: { email: 'user1@dvara.local' },
  });
  if (!user) throw new Error('User1 manquant');

  // Récupère un media de test pour le logo
  const logo = await prisma.media.findFirst({
    where: { imgName: 'media-test-1' },
  });
  if (!logo) throw new Error('Media de test manquant');

  // Nettoyage des dashboards de test existants
  await prisma.dashboard.deleteMany({ where: { name: 'Dashboard Test 1' } });

  // Crée les sous-modèles nécessaires
  const general = await prisma.dashboardSettingsGeneral.create({
    data: {
      pageTitle: 'Dashboard Test 1',
      logoMediaId: logo.id,
      faviconMediaId: logo.id,
    },
  });
  const background = await prisma.dashboardSettingsBackground.create({
    data: {
      position: 'FIXED',
      size: 'COVER',
      repeat: 'NO_REPEAT',
      mediaId: logo.id,
    },
  });
  const layout = await prisma.dashboardSettingsLayout.create({
    data: {
      layouts: [{ name: 'default', breakpoint: 'lg', columns: 12 }],
    },
  });
  const appearance = await prisma.dashboardSettingsAppearance.create({
    data: {
      mainColor: '#000000',
      secondaryColor: '#ffffff',
      transparent: 1,
      iconColor: '#000000',
      borderRadius: 'M',
    },
  });
  const access = await prisma.dashboardSettingsAccess.create({
    data: {
      users: { create: [{ userId: user.id, permission: 'OWNER' }] },
    },
  });
  const settings = await prisma.dashboardSettings.create({
    data: {
      generalId: general.id,
      backgroundId: background.id,
      layoutId: layout.id,
      appearanceId: appearance.id,
      accessId: access.id,
    },
  });
  const content = await prisma.dashboardContent.create({ data: {} });

  // Crée le dashboard de test
  await prisma.dashboard.create({
    data: {
      name: 'Dashboard Test 1',
      ownerId: user.id,
      settingsId: settings.id,
      contentId: content.id,
      public: false,
    },
  });
  console.log('Dashboard de test seedé.');
}
