/**
 * Extract @mentions from comment content
 * Returns array of user IDs mentioned in the format @[userId:userName]
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([a-f0-9-]+):[^\]]+\]/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Check if a user is mentioned in the comment
 */
export function isMentioned(content: string, userId: string): boolean {
  const mentions = extractMentions(content);
  return mentions.includes(userId);
}

/**
 * Format mention for display
 * Converts @[userId:userName] to @userName
 */
export function formatMentions(content: string): string {
  return content.replace(/@\[[a-f0-9-]+:([^\]]+)\]/g, '@$1');
}

/**
 * Create mention string
 */
export function createMention(userId: string, userName: string): string {
  return `@[${userId}:${userName}]`;
}
