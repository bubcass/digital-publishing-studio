export const BOOKMARK_KEY = 'inside-parliament-bookmarks';

export function readBookmarks() {
  if (typeof window === 'undefined') return [] as string[];

  try {
    const stored = window.localStorage.getItem(BOOKMARK_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}
