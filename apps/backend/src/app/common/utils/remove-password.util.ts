// Removes the password and refreshToken fields from a user object before returning it in API responses.
export function removePassword<
  T extends { password?: string; refreshToken?: string | null },
>(user: T): Omit<T, 'password' | 'refreshToken'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, refreshToken, ...rest } = user;
  return rest;
}
