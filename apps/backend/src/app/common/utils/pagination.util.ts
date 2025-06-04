/**
 * Utility to parse pagination query parameters from a request.
 * Ensures default values and enforces a maximum limit.
 *
 * @param pageRaw - The raw page query param (string or undefined)
 * @param limitRaw - The raw limit query param (string or undefined)
 * @param defaultPage - Default page number (default: 1)
 * @param defaultLimit - Default limit (default: 20)
 * @param maxLimit - Maximum allowed limit (default: 100)
 * @returns { page: number, limit: number }
 *
 * Usage:
 *   const { page, limit } = parsePaginationParams(page, limit);
 */
export function parsePaginationParams(
  pageRaw?: string,
  limitRaw?: string,
  defaultPage = 1,
  defaultLimit = 20,
  maxLimit = 100,
): { page: number; limit: number } {
  let page = Number(pageRaw);
  let limit = Number(limitRaw);
  if (!Number.isFinite(page) || page < 1) page = defaultPage;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  return { page, limit };
}
