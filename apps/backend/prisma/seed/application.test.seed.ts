import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  // Nettoyage des applications de test existantes
  await prisma.application.deleteMany({
    where: {
      name: { in: ['App Test 1', 'App Test 2', 'App Test 3'] },
    },
  });

  // Récupère les médias de test
  const media1 = await prisma.media.findFirst({
    where: { imgName: 'media-test-1' },
  });
  const media2 = await prisma.media.findFirst({
    where: { imgName: 'media-test-2' },
  });
  const media3 = await prisma.media.findFirst({
    where: { imgName: 'media-test-3' },
  });
  if (!media1 || !media2 || !media3)
    throw new Error('Médias de test manquants');

  // Création des applications de test
  await prisma.application.create({
    data: {
      name: 'App Test 1',
      iconMediaId: media1.id,
      description: 'Application de test 1',
      url: 'https://apptest1.example.com',
      displayPingUrl: true,
      pingUrl: 'https://apptest1.example.com/ping',
    },
  });
  await prisma.application.create({
    data: {
      name: 'App Test 2',
      iconMediaId: media2.id,
      description: 'Application de test 2',
      url: 'https://apptest2.example.com',
      displayPingUrl: false,
      pingUrl: null,
    },
  });
  await prisma.application.create({
    data: {
      name: 'App Test 3',
      iconMediaId: media3.id,
      description: 'Application de test 3',
      url: 'https://apptest3.example.com',
      displayPingUrl: true,
      pingUrl: 'https://apptest3.example.com/ping',
    },
  });
  console.log('Applications de test seedées.');
}
