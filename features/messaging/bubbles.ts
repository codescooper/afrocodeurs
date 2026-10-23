export function bubbleVisible(conversation: { id: string; updatedAt: string; unread: number; lastMessageAuthorId?: string | null }, dismissed: Record<string, string>, userId: string) {
  const closedAt = dismissed[conversation.id];
  return !closedAt || (conversation.updatedAt > closedAt && conversation.unread > 0 && conversation.lastMessageAuthorId !== userId);
}
