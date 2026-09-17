/**
 * Distinct, mid-to-dark colors chosen for contrast with light initials text.
 */
export const AVATAR_COLORS = [
  '#c62828',
  '#ad1457',
  '#6a1b9a',
  '#4527a0',
  '#283593',
  '#1565c0',
  '#0277bd',
  '#00838f',
  '#2e7d32',
  '#558b2f',
  '#ef6c00',
  '#d84315',
  '#4e342e',
  '#37474f',
] as const;

/**
 * Converts a string into a non-negative integer hash.
 */
export function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) + hash);
  }
  return Math.abs(hash);
}

/**
 * Picks a stable background color from {@link AVATAR_COLORS} based on `name`.
 */
export function getAvatarColor(name: string): string {
  if (!name) {
    return AVATAR_COLORS[0];
  }
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
}
