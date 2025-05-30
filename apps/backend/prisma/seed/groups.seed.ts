/* eslint-disable @typescript-eslint/no-misused-promises */
// Prisma seed file for system groups
// Run with: npx ts-node prisma/seed/groups.seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create or find all permissions (full rights for super admin, limited for everyone)
  // DashPerm
  const dashPermAll = await prisma.dashPerm.upsert({
    where: { name: 'ALL' },
    update: {},
    create: {
      name: 'ALL',
      description: 'All dashboard permissions',
      canAdd: true,
      canEdit: true,
      canView: true,
      canUse: true,
      canDelete: true,
    },
  });
  const dashPermBasic = await prisma.dashPerm.upsert({
    where: { name: 'BASIC' },
    update: {},
    create: {
      name: 'BASIC',
      description: 'Basic dashboard permissions',
      canAdd: true,
      canEdit: true,
      canView: true,
      canUse: false,
      canDelete: true,
    },
  });
  // AppsPerm
  const appsPermAll = await prisma.appsPerm.upsert({
    where: { name: 'ALL' },
    update: {},
    create: {
      name: 'ALL',
      description: 'All applications permissions',
      canAdd: true,
      canEdit: true,
      canView: true,
      canUse: true,
      canDelete: true,
    },
  });
  const appsPermBasic = await prisma.appsPerm.upsert({
    where: { name: 'BASIC' },
    update: {},
    create: {
      name: 'BASIC',
      description: 'Basic applications permissions',
      canAdd: true,
      canEdit: true,
      canView: true,
      canUse: false,
      canDelete: true,
    },
  });
  // MediaPerm
  const mediaPermAll = await prisma.mediaPerm.upsert({
    where: { name: 'ALL' },
    update: {},
    create: {
      name: 'ALL',
      description: 'All media permissions',
      canUpload: true,
      canEdit: true,
      canView: true,
      canUse: true,
      canDelete: true,
    },
  });
  const mediaPermBasic = await prisma.mediaPerm.upsert({
    where: { name: 'BASIC' },
    update: {},
    create: {
      name: 'BASIC',
      description: 'Basic media permissions',
      canUpload: true,
      canEdit: true,
      canView: true,
      canUse: false,
      canDelete: true,
    },
  });

  // Create GroupPermissions for super admin (all rights)
  const superAdminPerm = await prisma.groupPermission.upsert({
    where: { name: 'SUPER_ADMIN_ALL' },
    update: {},
    create: {
      name: 'SUPER_ADMIN_ALL',
      description: 'Full rights for super admin',
      dashPerm: { connect: { id: dashPermAll.id } },
      appsPerm: { connect: { id: appsPermAll.id } },
      mediaPerm: { connect: { id: mediaPermAll.id } },
    },
  });
  // Create GroupPermissions for everyone (basic rights)
  const everyonePerm = await prisma.groupPermission.upsert({
    where: { name: 'EVERYONE_BASIC' },
    update: {},
    create: {
      name: 'EVERYONE_BASIC',
      description: 'Basic rights for everyone',
      dashPerm: { connect: { id: dashPermBasic.id } },
      appsPerm: { connect: { id: appsPermBasic.id } },
      mediaPerm: { connect: { id: mediaPermBasic.id } },
    },
  });

  // Create system groups
  await prisma.group.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      system: true,
      permissions: { connect: [{ id: superAdminPerm.id }] },
    },
  });
  await prisma.group.upsert({
    where: { name: 'EVERYONE' },
    update: {},
    create: {
      name: 'EVERYONE',
      system: true,
      permissions: { connect: [{ id: everyonePerm.id }] },
    },
  });

  console.log('System groups and permissions seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
