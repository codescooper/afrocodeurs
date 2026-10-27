export function collaborationRetryAt(status: string, updatedAt: Date) {
  if (status === "DECLINED") return new Date(updatedAt.getTime() + 7 * 86400000);
  if (status === "CANCELLED") return new Date(updatedAt.getTime() + 60000);
  return null;
}

export function collaborationHistory(value: unknown): { message: string; status: string; at: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { message: string; status: string; at: string } => Boolean(item) && typeof item === "object" && typeof item.message === "string" && typeof item.status === "string" && typeof item.at === "string");
}
