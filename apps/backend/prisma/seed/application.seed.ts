/* eslint-disable @typescript-eslint/require-await */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ce seed ne crée aucune application de test. Utiliser application.test.seed.ts pour les données de test.
  console.log('Aucune application de test seedée (seed principal).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
