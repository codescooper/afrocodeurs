export const VISITOR_COOKIE = "afrocodeurs-visitor";
export const PREVIEW_COOKIE = "afrocodeurs-preview";

export function shouldShowCommunityEntry(signedIn: boolean, visitor?: string, preview?: string) {
  return !signedIn && visitor !== "1" && preview !== "open";
}
