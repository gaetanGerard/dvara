/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient, DayOfWeekName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const days: { name: DayOfWeekName }[] = [
    { name: DayOfWeekName.MONDAY },
    { name: DayOfWeekName.SATURDAY },
    { name: DayOfWeekName.SUNDAY },
  ];

  for (const day of days) {
    await prisma.dayOfWeek.upsert({
      where: { name: day.name },
      update: {},
      create: day,
    });
  }
  console.log('Days of week seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
