import type { StorArticle } from '$lib/content/stor/types';

export const CURRENT_PREVIEW_KEY = 'oireachtas-publishing-studio/current-preview';
export const PREVIEW_ARTICLES_KEY = 'oireachtas-publishing-studio/preview-articles';

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function savePreviewArticle(article: StorArticle) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(CURRENT_PREVIEW_KEY, JSON.stringify(article));

  const current = safeParse<Record<string, StorArticle>>(window.localStorage.getItem(PREVIEW_ARTICLES_KEY)) ?? {};
  current[article.slug] = article;
  window.localStorage.setItem(PREVIEW_ARTICLES_KEY, JSON.stringify(current));
}

export function readCurrentPreviewArticle(): StorArticle | null {
  if (typeof window === 'undefined') return null;
  return safeParse<StorArticle>(window.localStorage.getItem(CURRENT_PREVIEW_KEY));
}

export function listPreviewArticles(): StorArticle[] {
  if (typeof window === 'undefined') return [];
  const current = safeParse<Record<string, StorArticle>>(window.localStorage.getItem(PREVIEW_ARTICLES_KEY)) ?? {};
  return Object.values(current);
}
