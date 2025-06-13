import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Récupère le premier user non superadmin
  const user = await prisma.user.findFirst({
    where: { email: { not: 'superadmin@dvara.local' } },
    orderBy: { id: 'asc' },
  });
  if (!user) throw new Error('No non-superadmin user found');

  // Crée un media pour le logo si besoin
  const logo = await prisma.media.upsert({
    where: { imgName: 'dashboard-logo-seed' },
    update: {},
    create: {
      name: 'Dashboard Logo',
      imgName: 'dashboard-logo-seed',
      alt: 'logo',
      url: 'https://dummyimage.com/100x100/000/fff',
    },
  });

  // Crée les sous-modèles nécessaires
  const general = await prisma.dashboardSettingsGeneral.create({
    data: {
      pageTitle: 'Main Dashboard',
      logoMedia: { connect: { id: logo.id } },
      faviconMedia: { connect: { id: logo.id } },
    },
  });
  const background = await prisma.dashboardSettingsBackground.create({
    data: {
      position: 'FIXED',
      size: 'COVER',
      repeat: 'NO_REPEAT',
      media: { connect: { id: logo.id } },
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
      users: {
        create: [{ userId: user.id, permission: 'OWNER' }],
      },
    },
  });

  // Crée les settings nécessaires
  const settings = await prisma.dashboardSettings.create({
    data: {
      generalId: general.id,
      backgroundId: background.id,
      layoutId: layout.id,
      appearanceId: appearance.id,
      accessId: access.id,
    },
  });

  // Crée le content
  const content = await prisma.dashboardContent.create({
    data: {},
  });

  // Vérifie si un dashboard existe déjà pour ce user
  let dashboard = await prisma.dashboard.findFirst({
    where: { ownerId: user.id },
  });
  if (!dashboard) {
    dashboard = await prisma.dashboard.create({
      data: {
        name: 'Main Dashboard',
        ownerId: user.id,
        settingsId: settings.id,
        contentId: content.id,
        public: false,
      },
    });
  }

  console.log('Dashboard seeded for user', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
