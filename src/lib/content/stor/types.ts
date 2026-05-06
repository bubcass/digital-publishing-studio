export interface StorContributor {
  name: string;
  role?: string;
  affiliation?: string;
  showAsAuthor?: boolean;
}

export interface StorArticle {
  slug: string;
  title: string;
  blocks: StorBlock[];
  id?: string;
  type?: string;
  destination?: string;
  dek?: string;
  section?: string;
  committeeName?: string;
  topics?: string[];
  /** @deprecated prefer section */
  theme?: string;
  layout?: string;
  status?: string;
  hero?: StorImageAsset;
  contributors?: StorContributor[];
  /** @deprecated prefer contributors */
  authors?: StorContributor[];
  publishedDate?: string | null;
}

export type StorBlock =
  | StorHeadingBlock
  | StorParagraphBlock
  | StorCalloutBlock
  | StorQuoteBlock
  | StorImageBlock
  | StorChartBlock;

export interface StorImageAsset {
  type?: 'image' | 'video';
  src: string;
  alt: string;
  poster?: string | null;
  caption?: string | null;
  credit?: string | null;
}

export interface StorHeadingBlock {
  type: 'heading';
  level?: number;
  text: string;
}

export interface StorParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface StorCalloutBlock {
  type: 'callout';
  text: string;
  title?: string;
  style?: string;
}

export interface StorQuoteBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface StorChartBlock {
  type: 'chart';
  title?: string;
  component?: string;
  data?: string;
}

export interface StorImageBlock {
  type: 'image';
  image: StorImageAsset;
  layout?: 'inline' | 'wide' | 'full';
}

export interface StorImportIssue {
  filePath: string;
  slugHint: string;
  message: string;
}
