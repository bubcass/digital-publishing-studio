// src/metadata/schema.js
import { z } from 'zod'

// --- Contributor schema (unchanged) ---
export const Contributor = z.object({
  role: z.string(),                         // 'author', 'editor', 'reviewer', …
  showAsAuthor: z.boolean().optional(),
  given: z.string().optional().default(''),
  family: z.string().optional().default(''),
  email: z.string().email().optional(),
  orcid: z.string().optional(),
  affiliation: z.union([
    z.string(),
    z.object({
      org: z.string().default('Houses of the Oireachtas'),
      unitCode: z.string(),
      unit: z.string(),
      committeeCode: z.string().optional(),
      country: z.string().optional(),
    }),
  ]).optional(),
})

// --- Top-level metadata schema (lenient to avoid breaking initial parse) ---
export const MetadataSchema = z.object({
  storId: z.string().optional(),
  slug: z.string().optional(),
  destination: z.union([z.enum(['stor', 'inside-parliament', 'committee-reports']), z.literal('')]).optional(),
  contentType: z.string().optional(),
  title: z.string().optional().default(''),
  dek: z.string().optional(),
  section: z.string().optional(),
  committeeName: z.string().optional(),
  topics: z.array(z.string().min(1)).optional().default([]),
  theme: z.string().optional(),
  layout: z.string().optional(),
  hero: z.object({
    type: z.enum(['image', 'video']).optional(),
    src: z.string().optional(),
    alt: z.string().optional(),
    poster: z.string().optional(),
    caption: z.string().optional(),
    credit: z.string().optional(),
  }).optional(),
  subtitle: z.string().optional(),
  abstract: z.string().optional(),

  language: z.string().min(2, 'Language code required'),

  // includes "in_review"
  status: z.enum(['draft', 'in_review', 'published', 'archived']),

  // Make these OPTIONAL here (with defaults) so initial parse never throws.
  // Your export gating should enforce they’re filled (in validateMetadata).
  version: z.string().optional().default(''),
  keywords: z.array(z.string().min(1)).optional().default([]),

  datePublished: z.string().optional(),     // ISO date (YYYY-MM-DD or full ISO)
  dateModified: z.string().optional(),
  doi: z.string().optional(),
  license: z.string().optional(),

  publisher: z.string().default('Houses of the Oireachtas'),

  // renamed from "imprint" → "unit"
  unit: z
    .object({
      unitCode: z.string(),                 // e.g., 'PBO'
      unit: z.string(),                     // display name
      committeeCode: z.string().optional(), // if Committees
    })
    .optional(),

  contributors: z.array(Contributor).default([]),
})
