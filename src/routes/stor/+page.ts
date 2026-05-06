import { storArticles } from '$lib/content/stor';

export const prerender = true;

export function load() {
  return {
    articles: storArticles.map((article) => ({
      slug: article.slug,
      title: article.title,
      section: article.section ?? article.committeeName ?? article.theme ?? null,
      dek: article.dek ?? null,
      publishedDate: article.publishedDate ?? null
    }))
  };
}
