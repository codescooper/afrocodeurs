/** Bound database offsets using the current owner's count, never untrusted input. */
export const MEMBER_UPDATE_PAGE_SIZE = 30;
export function memberUpdatePagination(value: string | undefined, total: number) {
  const pages = Math.max(1, Math.ceil(total / MEMBER_UPDATE_PAGE_SIZE));
  const requested = value && /^\d+$/.test(value) ? Number(value) : 1;
  const page = Number.isSafeInteger(requested) ? Math.min(pages, Math.max(1, requested)) : 1;
  return { page, pages, skip: (page - 1) * MEMBER_UPDATE_PAGE_SIZE, take: MEMBER_UPDATE_PAGE_SIZE };
}
