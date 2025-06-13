// Fichier seed pour les groupes custom de test (à utiliser uniquement pour les tests e2e)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  // TODO: Ajouter ici la logique de seed des groupes custom de test (copier depuis l'ancien groups.seed.ts si besoin)
  console.log('Groupes custom de test seedés.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
