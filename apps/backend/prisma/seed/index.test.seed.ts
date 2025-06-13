import { seed as seedMedia } from './media.test.seed';
import { seed as seedUser } from './user.test.seed';
import { seed as seedGroups } from './groups.test.seed';
import { seed as seedApp } from './application.test.seed';
import { seed as seedDashboard } from './dashboard.test.seed';

async function runSeeds() {
  await seedMedia();
  await seedUser();
  await seedGroups();
  await seedApp();
  await seedDashboard();
  console.log('Tous les seeds de test ont été exécutés.');
}

runSeeds().catch((e) => {
  console.error(e);
  process.exit(1);
});
