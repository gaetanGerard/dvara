/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const languages = [
    { iso: 'fr', name: 'Français' },
    { iso: 'en', name: 'English' },
    // Ajoute d'autres langues si besoin
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { iso: lang.iso },
      update: {},
      create: lang,
    });
  }
  console.log('Languages seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
