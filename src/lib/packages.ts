/** Credit economy and package catalogue from the engine blueprint. */

export const CREDIT_VALUE_MYR = 5;

export type PackageTier = 'trial' | 'starter' | 'professional' | 'business' | 'diamond';

export type PackageDefinition = {
  id: PackageTier;
  name: string;
  priceMyr: number;
  credits: number;
  kits: string;
  billing: 'one-time' | 'monthly';
  features: string[];
};

export const PACKAGES: PackageDefinition[] = [
  {
    id: 'trial',
    name: 'Trial',
    priceMyr: 0,
    credits: 3,
    kits: 'Preview only',
    billing: 'one-time',
    features: ['3 demo credits', 'Image recognition preview', 'No commercial licence'],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMyr: 550,
    credits: 110,
    kits: 'about 10 launch kits',
    billing: 'one-time',
    features: ['Market insight', 'TikTok copywriting', '4K product visuals'],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMyr: 2500,
    credits: 550,
    kits: 'about 50 launch kits',
    billing: 'one-time',
    features: ['Everything in Starter', 'Cinematic video generation', 'Priority production queue'],
  },
  {
    id: 'business',
    name: 'Business',
    priceMyr: 4500,
    credits: 1100,
    kits: 'about 100 launch kits',
    billing: 'one-time',
    features: ['Everything in Professional', 'Bulk SKU production', 'Dedicated operator support'],
  },
  {
    id: 'diamond',
    name: 'Diamond VIP',
    priceMyr: 15000,
    credits: 3500,
    kits: 'Unlimited within credit budget',
    billing: 'monthly',
    features: ['Human QC pass', 'Private prompt tuning', '500GB private asset cloud'],
  },
];

/** Credit cost per engine stage. */
export const STEP_CREDIT_COST: Record<number, number> = {
  1: 1, // image ingestion / recognition
  2: 0, // market research
  3: 0, // copy matching
  4: 2, // 4 x 4K commercial images
  5: 2, // cinematic video
  6: 0, // export
};
