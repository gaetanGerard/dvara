// Removes the password field from a user object before returning it in API responses.
export function removePassword<T extends { password?: string }>(
  user: T,
): Omit<T, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}
