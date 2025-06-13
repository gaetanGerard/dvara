import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  // Supprime d'abord les dashboards de test qui référencent les médias
  await prisma.dashboard.deleteMany({ where: { name: 'Dashboard Test 1' } });
  // Supprime d'abord les applications de test qui référencent les médias
  await prisma.application.deleteMany({
    where: {
      name: { in: ['App Test 1', 'App Test 2', 'App Test 3'] },
    },
  });
  // Puis supprime les médias de test
  await prisma.media.deleteMany({
    where: {
      imgName: { in: ['media-test-1', 'media-test-2', 'media-test-3'] },
    },
  });

  // Création de médias de test
  await prisma.media.create({
    data: {
      name: 'Media Test 1',
      imgName: 'media-test-1',
      alt: 'Image de test 1',
      url: 'https://dummyimage.com/100x100/000/fff&text=Test1',
    },
  });
  await prisma.media.create({
    data: {
      name: 'Media Test 2',
      imgName: 'media-test-2',
      alt: 'Image de test 2',
      url: 'https://dummyimage.com/100x100/111/eee&text=Test2',
    },
  });
  await prisma.media.create({
    data: {
      name: 'Media Test 3',
      imgName: 'media-test-3',
      alt: 'Image de test 3',
      url: 'https://dummyimage.com/100x100/222/ddd&text=Test3',
    },
  });
  console.log('Médias de test seedés.');
}
