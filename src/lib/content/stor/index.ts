import type {
  StorArticle,
  StorContributor,
  StorBlock,
  StorImageAsset,
  StorImportIssue,
} from './types';

function fileSlug(path: string) {
  return path.split('/').pop()?.replace(/\.json$/i, '') || 'unknown-stor-file';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function cleanString(value: unknown) {
  return isString(value) ? value.trim() : '';
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

function normalizeContributors(value: unknown): StorContributor[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((contributor) => {
      if (isString(contributor)) {
        const name = contributor.trim();
        return name ? { name, role: 'author', showAsAuthor: true } : null;
      }

      if (!isRecord(contributor)) return null;

      const name = cleanString(contributor.name);
      if (!name) return null;

      const role = cleanString(contributor.role);
      const affiliation = cleanString(contributor.affiliation);
      const showAsAuthor =
        typeof contributor.showAsAuthor === 'boolean' ? contributor.showAsAuthor : undefined;
      return {
        name,
        ...(role ? { role } : {}),
        ...(affiliation ? { affiliation } : {}),
        ...(typeof showAsAuthor === 'boolean' ? { showAsAuthor } : {}),
      };
    })
    .filter((contributor): contributor is StorContributor => contributor !== null);
}

function normalizeHeadingBlock(block: Record<string, unknown>): StorBlock | null {
  const text = cleanString(block.text);
  if (!text) return null;

  return {
    type: 'heading',
    text,
    level: typeof block.level === 'number' ? block.level : 2,
  };
}

function normalizeParagraphBlock(block: Record<string, unknown>): StorBlock | null {
  const text = cleanString(block.text);
  return text ? { type: 'paragraph', text } : null;
}

function normalizeCalloutBlock(block: Record<string, unknown>): StorBlock | null {
  const text = cleanString(block.text);
  if (!text) return null;

  const title = cleanString(block.title);
  const style = cleanString(block.style);

  return {
    type: 'callout',
    text,
    ...(title ? { title } : {}),
    ...(style ? { style } : {}),
  };
}

function normalizeQuoteBlock(block: Record<string, unknown>): StorBlock | null {
  const text = cleanString(block.text);
  if (!text) return null;

  const attribution = cleanString(block.attribution);
  return {
    type: 'quote',
    text,
    ...(attribution ? { attribution } : {}),
  };
}

function normalizeChartBlock(block: Record<string, unknown>): StorBlock {
  const title = cleanString(block.title);
  const component = cleanString(block.component);
  const data = cleanString(block.data);

  return {
    type: 'chart',
    ...(title ? { title } : {}),
    ...(component ? { component } : {}),
    ...(data ? { data } : {}),
  };
}

function normalizeImageBlock(block: Record<string, unknown>): StorBlock | null {
  const image = normalizeImageAsset(block.image);
  if (!image) return null;

  const layout = cleanString(block.layout);
  return {
    type: 'image',
    image,
    ...(layout ? { layout: layout as 'inline' | 'wide' | 'full' } : {}),
  };
}

function normalizeBlock(block: unknown): StorBlock | null {
  if (!isRecord(block) || !isString(block.type)) return null;

  if (block.type === 'heading') return normalizeHeadingBlock(block);
  if (block.type === 'paragraph') return normalizeParagraphBlock(block);
  if (block.type === 'callout') return normalizeCalloutBlock(block);
  if (block.type === 'quote') return normalizeQuoteBlock(block);
  if (block.type === 'image') return normalizeImageBlock(block);
  if (block.type === 'chart') return normalizeChartBlock(block);

  return null;
}

function malformed(path: string, slugHint: string, message: string) {
  return {
    ok: false as const,
    issue: {
      filePath: path,
      slugHint,
      message,
    } satisfies StorImportIssue,
  };
}

function validateStorArticle(value: unknown, path: string) {
  const guessedSlug = fileSlug(path);

  if (!isRecord(value)) {
    return malformed(
      path,
      guessedSlug,
      `Malformed Stór JSON in ${guessedSlug}: expected a top-level object.`,
    );
  }

  const slug = cleanString(value.slug);
  if (!slug) {
    return malformed(
      path,
      guessedSlug,
      `Malformed Stór JSON in ${guessedSlug}: required field "slug" is missing or empty.`,
    );
  }

  const title = cleanString(value.title);
  if (!title) {
    return malformed(
      path,
      slug,
      `Malformed Stór JSON in ${slug}: required field "title" is missing or empty.`,
    );
  }

  if (!Array.isArray(value.blocks)) {
    return malformed(
      path,
      slug,
      `Malformed Stór JSON in ${slug}: required field "blocks" must be an array.`,
    );
  }

  const blocks = value.blocks
    .map(normalizeBlock)
    .filter((block): block is StorBlock => block !== null);

  const contributors = normalizeContributors(value.contributors);
  const authors = !contributors.length ? normalizeContributors(value.authors) : [];
  const hero = normalizeImageAsset(value.hero);
  const topics = normalizeTopics(value.topics);

  return {
    ok: true as const,
    article: {
      slug,
      title,
      blocks,
      ...(cleanString(value.id) ? { id: cleanString(value.id) } : {}),
      ...(cleanString(value.type) ? { type: cleanString(value.type) } : {}),
      ...(cleanString(value.destination)
        ? { destination: cleanString(value.destination) }
        : {}),
      ...(cleanString(value.dek) ? { dek: cleanString(value.dek) } : {}),
      ...(cleanString(value.section) ? { section: cleanString(value.section) } : {}),
      ...(cleanString(value.committeeName)
        ? { committeeName: cleanString(value.committeeName) }
        : {}),
      ...(cleanString(value.theme) ? { theme: cleanString(value.theme) } : {}),
      ...(topics.length ? { topics } : {}),
      ...(cleanString(value.layout) ? { layout: cleanString(value.layout) } : {}),
      ...(cleanString(value.status) ? { status: cleanString(value.status) } : {}),
      ...(hero ? { hero } : {}),
      ...(contributors.length ? { contributors } : {}),
      ...(authors.length ? { authors } : {}),
      ...(isString(value.publishedDate) || value.publishedDate === null
        ? { publishedDate: value.publishedDate }
        : {}),
    } satisfies StorArticle,
  };
}

const storModules = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const validatedStorModules = Object.entries(storModules).map(([path, value]) =>
  validateStorArticle(value, path),
);

export const storArticles: StorArticle[] = validatedStorModules
  .filter((entry): entry is { ok: true; article: StorArticle } => entry.ok)
  .map((entry) => entry.article);

export const storImportIssues: StorImportIssue[] = validatedStorModules
  .filter((entry): entry is { ok: false; issue: StorImportIssue } => !entry.ok)
  .map((entry) => entry.issue);

export function getStorArticle(slug: string) {
  return storArticles.find((article) => article.slug === slug);
}

export function getStorImportIssue(slug: string) {
  return storImportIssues.find(
    (issue) => issue.slugHint === slug || fileSlug(issue.filePath) === slug,
  );
}
