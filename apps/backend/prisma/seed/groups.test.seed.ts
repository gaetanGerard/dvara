import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  // Nettoyage du groupe de test existant
  await prisma.group.deleteMany({ where: { name: 'Test Group 1' } });

  // Récupère la permission de base (EVERYONE_BASIC)
  const basicPerm = await prisma.groupPermission.findFirst({
    where: { name: 'EVERYONE_BASIC' },
  });
  if (!basicPerm) throw new Error('Permission EVERYONE_BASIC manquante');

  // Crée le groupe de test avec la permission de base
  const group = await prisma.group.create({
    data: {
      name: 'Test Group 1',
      system: false,
      permissions: { connect: [{ id: basicPerm.id }] },
    },
  });

  // Lie user1 à ce groupe
  const user = await prisma.user.findFirst({
    where: { email: 'user1@dvara.local' },
  });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        groups: { connect: { id: group.id } },
      },
    });
  }
  console.log('Groupe de test créé, permission de base liée et user1 lié.');
}
