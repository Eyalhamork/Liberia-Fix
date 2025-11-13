// lib/utils/avatar.ts
export const DEFAULT_AVATARS = [
  "👨🏿",
  "👩🏿",
  "👨🏿‍🦱",
  "👩🏿‍🦱",
  "👨🏾",
  "👩🏾",
  "👨🏾‍🦱",
  "👩🏾‍🦱",
  "🧑🏿",
  "🧑🏾",
  "👨🏿‍💼",
  "👩🏿‍💼",
  "👨🏾‍💼",
  "👩🏾‍💼",
  "👨🏿‍🔧",
  "👩🏿‍🔧",
  "👨🏾‍🔧",
  "👩🏾‍🔧",
  "🧑🏿‍💼",
  "🧑🏾‍💼",
];

/**
 * Get a consistent default avatar emoji for a user
 * @param userId - User ID to generate consistent avatar
 * @param name - Optional name for better consistency
 * @returns Emoji avatar string
 */
export function getDefaultAvatar(userId: string, name?: string): string {
  // Create a simple hash from userId to get consistent avatar
  let hash = 0;
  const str = userId + (name || "");

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Get positive index
  const index = Math.abs(hash) % DEFAULT_AVATARS.length;
  return DEFAULT_AVATARS[index];
}

/**
 * Get random default avatar (for when no userId available)
 */
export function getRandomDefaultAvatar(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
  return DEFAULT_AVATARS[randomIndex];
}
