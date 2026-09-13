/**
 * Central runtime configuration.
 *
 * Every value is read from the process environment so the same image can be
 * promoted between machines by swapping /opt/namigo/.env.production only.
 */

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Supabase mode is the production path. When the project keys are absent the
 * app falls back to the temporary file-backed store described in the manual,
 * which is only meant for VPS smoke tests.
 */
export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseAdminEnabled = Boolean(supabaseUrl && supabaseServiceRoleKey);

export const ownerPin = process.env.NAMIGO_OWNER_PIN ?? '';
export const webhookSecret = process.env.NAMIGO_WEBHOOK_SECRET ?? '';

export const dataDir = process.env.NAMIGO_DATA_DIR ?? '/app-data';
export const uploadsDir = `${dataDir}/uploads`;
export const passcodeStorePath = `${dataDir}/namigo-demo-passcodes.json`;
export const jobStorePath = `${dataDir}/namigo-jobs.json`;

export const ownerProtection = {
  enabled: process.env.NAMIGO_OWNER_PROTECTION === 'enabled',
  lockcode: process.env.NAMIGO_OWNER_LOCKCODE ?? '',
  ownerUserId: process.env.NAMIGO_OWNER_USER_ID ?? '',
  ownerCompany: process.env.NAMIGO_OWNER_COMPANY ?? 'AMAZ MAXS ENTERPRISE',
  productName: process.env.NAMIGO_PRODUCT_NAME ?? 'NamiGo X',
  licenseId: process.env.NAMIGO_LICENSE_ID ?? '',
  licenseDomain: process.env.NAMIGO_LICENSE_DOMAIN ?? '',
  licenseServerIp: process.env.NAMIGO_LICENSE_SERVER_IP ?? '',
  deploymentIp: process.env.NAMIGO_DEPLOYMENT_IP ?? '',
  buildFingerprint: process.env.NAMIGO_BUILD_FINGERPRINT ?? 'NGX-DEV',
};

export const n8n = {
  baseUrl: process.env.N8N_BASE_URL ?? '',
  webhookPublicUrl: process.env.N8N_WEBHOOK_PUBLIC_URL ?? '',
};

export const stripe = {
  secretKey: process.env.STRIPE_SECRET_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  prices: {
    starter: process.env.STRIPE_PRICE_STARTER ?? '',
    professional: process.env.STRIPE_PRICE_PROFESSIONAL ?? '',
    business: process.env.STRIPE_PRICE_BUSINESS ?? '',
    diamond: process.env.STRIPE_PRICE_DIAMOND ?? '',
  },
};
