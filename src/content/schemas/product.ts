export const PRODUCT_CATEGORIES = [
  'workflow-templates',
  'discovery-toolkit',
  'proposal-kit',
  'complete-playbook',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  'workflow-templates': 'Workflow Templates',
  'discovery-toolkit': 'Discovery Toolkit',
  'proposal-kit': 'Proposal Kit',
  'complete-playbook': 'Complete Playbook',
};

export const PRODUCT_LICENSE_TYPES = [
  'single-user',
  'team',
  'agency',
] as const;

export type ProductLicenseType = (typeof PRODUCT_LICENSE_TYPES)[number];

export const PRODUCT_LICENSE_LABELS: Record<ProductLicenseType, string> = {
  'single-user': 'Single user',
  team: 'Team (up to 10)',
  agency: 'Agency (unlimited seats)',
};

export interface Product {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  category: ProductCategory;
  licenseType: ProductLicenseType;
  priceCents: number;
  currency: string;
  stripePriceId: string;
  assetFilename: string;
  heroImageUrl?: string;
  lllEntryUrls: string[];
  relatedCaseIds: string[];
  publishedAt: string;
}
