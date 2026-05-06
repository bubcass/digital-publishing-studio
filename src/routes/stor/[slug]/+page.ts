import { error } from '@sveltejs/kit';
import { getStorArticle, storArticles } from '$lib/content/stor';

export const prerender = true;

export function entries() {
  return storArticles.map((article) => ({ slug: article.slug }));
}

export function load({ params }) {
  const article = getStorArticle(params.slug);

  if (!article) {
    error(404, 'Stór story not found');
  }

  return { story: article };
}
