export const CHAT_ACTIVE_MS = 2 * 60 * 1000;
export const CHAT_HEARTBEAT_MS = 30 * 1000;

export function chatOnline(lastSeen: Date | null | undefined, now = Date.now()) {
  return Boolean(lastSeen && lastSeen.getTime() >= now - CHAT_ACTIVE_MS);
}
