import { dev } from '$app/environment';

import type { StorArticle, StorBlock, StorContributor, StorImageAsset } from './types';

const previewArticles = new Map<string, StorArticle>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMediaPath(value: unknown) {
  const src = cleanString(value);
  if (!src) return '';

  const staticMediaMatch = src.match(/\/static\/media\/(.+)$/);
  if (staticMediaMatch) {
    return `/media/${staticMediaMatch[1]}`;
  }

  if (src.startsWith('/media/')) return src;
  if (src.startsWith('media/')) return `/${src}`;
  if (!src.includes('/') && /\.[a-z0-9]+$/i.test(src)) return `/media/${src}`;

  return src;
}

function inferAssetType(src: string, explicitType?: string) {
  if (explicitType === 'video' || explicitType === 'image') return explicitType;
  return /\.(mp4|webm|ogg|mov)$/i.test(src) ? 'video' : 'image';
}

function normalizeTopics(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((topic) => cleanString(topic))
    .filter(Boolean);
}

function normalizeImageAsset(value: unknown): StorImageAsset | null {
  if (!isRecord(value)) return null;

  const src = normalizeMediaPath(value.src);
  if (!src) return null;

  const alt = cleanString(value.alt);
  const poster = normalizeMediaPath(value.poster);
  const caption = cleanString(value.caption);
  const credit = cleanString(value.credit);

  return {
    type: inferAssetType(src, cleanString(value.type)),
    src,
    alt,
    ...(poster ? { poster } : {}),
    ...(caption ? { caption } : {}),
    ...(credit ? { credit } : {}),
  };
}

function normalizeContributor(value: unknown): StorContributor | null {
  if (!isRecord(value)) return null;

  const name = cleanString(value.name);
  if (!name) return null;

  const role = cleanString(value.role);
  const affiliation = cleanString(value.affiliation);
  const showAsAuthor = typeof value.showAsAuthor === 'boolean' ? value.showAsAuthor : undefined;

  return {
    name,
    ...(role ? { role } : {}),
    ...(affiliation ? { affiliation } : {}),
    ...(typeof showAsAuthor === 'boolean' ? { showAsAuthor } : {}),
  };
}

function normalizeBlock(value: unknown): StorBlock | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null;

  if (value.type === 'heading') {
    const text = cleanString(value.text);
    if (!text) return null;
    return { type: 'heading', text, level: typeof value.level === 'number' ? value.level : 2 };
  }

  if (value.type === 'paragraph') {
    const text = cleanString(value.text);
    return text ? { type: 'paragraph', text } : null;
  }

  if (value.type === 'callout') {
    const text = cleanString(value.text);
    if (!text) return null;
    const title = cleanString(value.title);
    const style = cleanString(value.style);
    return {
      type: 'callout',
      text,
      ...(title ? { title } : {}),
      ...(style ? { style } : {}),
    };
  }

  if (value.type === 'quote') {
    const text = cleanString(value.text);
    if (!text) return null;
    const attribution = cleanString(value.attribution);
    return {
      type: 'quote',
      text,
      ...(attribution ? { attribution } : {}),
    };
  }

  if (value.type === 'chart') {
    const title = cleanString(value.title);
    const component = cleanString(value.component);
    const data = cleanString(value.data);
    return {
      type: 'chart',
      ...(title ? { title } : {}),
      ...(component ? { component } : {}),
      ...(data ? { data } : {}),
    };
  }

  if (value.type === 'image') {
    const image = normalizeImageAsset(value.image);
    if (!image) return null;
    const layout = cleanString(value.layout);
    return {
      type: 'image',
      image,
      ...(layout ? { layout: layout as 'inline' | 'wide' | 'full' } : {}),
    };
  }

  return null;
}

export function validateStorPreviewArticle(value: unknown): StorArticle {
  if (!isRecord(value)) {
    throw new Error('Malformed preview JSON: expected a top-level object.');
  }

  const slug = cleanString(value.slug);
  if (!slug) {
    throw new Error('Malformed preview JSON: required field "slug" is missing or empty.');
  }

  const title = cleanString(value.title);
  if (!title) {
    throw new Error(`Malformed preview JSON for ${slug}: required field "title" is missing or empty.`);
  }

  if (!Array.isArray(value.blocks)) {
    throw new Error(`Malformed preview JSON for ${slug}: required field "blocks" must be an array.`);
  }

  const blocks = value.blocks
    .map(normalizeBlock)
    .filter((block): block is StorBlock => block !== null);

  const contributors = Array.isArray(value.contributors)
    ? value.contributors
      .map(normalizeContributor)
      .filter((contributor): contributor is StorContributor => contributor !== null)
    : [];

  const authors = !contributors.length && Array.isArray(value.authors)
    ? value.authors
      .map(normalizeContributor)
      .filter((contributor): contributor is StorContributor => contributor !== null)
    : [];

  const hero = normalizeImageAsset(value.hero);
  const topics = normalizeTopics(value.topics);

  return {
    slug,
    title,
    blocks,
    ...(cleanString(value.id) ? { id: cleanString(value.id) } : {}),
    ...(cleanString(value.type) ? { type: cleanString(value.type) } : {}),
    ...(cleanString(value.destination) ? { destination: cleanString(value.destination) } : {}),
    ...(cleanString(value.dek) ? { dek: cleanString(value.dek) } : {}),
    ...(cleanString(value.section) ? { section: cleanString(value.section) } : {}),
    ...(cleanString(value.committeeName) ? { committeeName: cleanString(value.committeeName) } : {}),
    ...(cleanString(value.theme) ? { theme: cleanString(value.theme) } : {}),
    ...(topics.length ? { topics } : {}),
    ...(cleanString(value.layout) ? { layout: cleanString(value.layout) } : {}),
    ...(cleanString(value.status) ? { status: cleanString(value.status) } : {}),
    ...(hero ? { hero } : {}),
    ...(contributors.length ? { contributors } : {}),
    ...(authors.length ? { authors } : {}),
    ...((typeof value.publishedDate === 'string' || value.publishedDate === null)
      ? { publishedDate: value.publishedDate }
      : {}),
  };
}

export function saveStorPreviewArticle(article: StorArticle) {
  if (!dev) {
    throw new Error('Direct preview storage is only available in development.');
  }

  previewArticles.set(article.slug, article);
}

export function getStorPreviewArticle(slug: string) {
  return previewArticles.get(slug) ?? null;
}

export function listStorPreviewArticles() {
  return [...previewArticles.values()];
}
