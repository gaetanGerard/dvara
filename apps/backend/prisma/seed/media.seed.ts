/* eslint-disable @typescript-eslint/require-await */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ce seed ne crée aucun média de test. Utiliser media.test.seed.ts pour les données de test.
  console.log('Aucun média de test seedé (seed principal).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
