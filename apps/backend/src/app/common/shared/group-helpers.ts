// Shared helpers for group logic (e.g. user/admin checks, deduplication, etc.)

/**
 * Returns true if the user is a super admin (has the super admin group id).
 */
export function isSuperAdmin(
  user: { groupIds?: number[] },
  superAdminGroupId: number,
): boolean {
  return (
    Array.isArray(user.groupIds) && user.groupIds.includes(superAdminGroupId)
  );
}

/**
 * Returns true if the user is an admin of the group (has the group id in adminGroupIds).
 */
export function isGroupAdmin(
  user: { adminGroupIds?: number[] },
  groupId: number,
): boolean {
  return (
    Array.isArray(user.adminGroupIds) && user.adminGroupIds.includes(groupId)
  );
}

/**
 * Deduplicate an array of numbers.
 */
export function dedupeIds(ids: number[]): number[] {
  return Array.from(new Set(ids));
}

/**
 * Checks if two arrays of numbers are equal (order-insensitive).
 */
export function areIdArraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, idx) => id === sortedB[idx]);
}

/**
 * Get the SUPER_ADMIN group (optionally with users).
 */
export async function getSuperAdminGroup(
  prisma: any,
  withUsers = false,
): Promise<{ id: number; users?: { id: number }[] } | null> {
  return (await prisma.group.findUnique({
    where: { name: 'SUPER_ADMIN' },
    ...(withUsers ? { include: { users: true } } : {}),
  })) as { id: number; users?: { id: number }[] } | null;
}

/**
 * Returns the list of user ids who are super admins (from the group entity).
 */
export function getSuperAdminIds(superAdminGroup: {
  users?: Array<{ id: number }>;
}): number[] {
  return Array.isArray(superAdminGroup.users)
    ? superAdminGroup.users.map((u) => u.id)
    : [];
}

/**
 * Returns true if the user is a super admin or admin of the group.
 */
export function hasGroupAdminRights(
  user: { groupIds?: number[]; adminGroupIds?: number[]; sub?: number },
  group: { id: number; admins: Array<{ id: number }> },
  superAdminGroupId: number,
): boolean {
  return (
    isSuperAdmin(user, superAdminGroupId) ||
    (Array.isArray(group.admins) && group.admins.some((a) => a.id === user.sub))
  );
}

/**
 * Throws if there is not at least one super admin in the group admins.
 */
export function assertAtLeastOneSuperAdminAdmin(
  newAdminIds: number[],
  superAdminIds: number[],
) {
  const adminsAfterUpdate = newAdminIds.filter((id) =>
    superAdminIds.includes(id),
  );
  if (adminsAfterUpdate.length === 0) {
    throw new Error(
      'There must always be at least one super_admin as group admin.',
    );
  }
}
