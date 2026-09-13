import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdminEnabled, uploadsDir } from '@/lib/config';
import { createJob, listJobs, type IntakeBrief } from '@/lib/jobs';
import { redeemPasscode } from '@/lib/passcodes';
import { serviceClient, userFromToken } from '@/lib/supabase';

export const runtime = 'nodejs';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Create a launch-kit job.
 *
 * A valid demo-kit passcode is mandatory. Direct API calls without one are
 * rejected here, which is what stops random users creating kits.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Expected multipart form data.' }, { status: 400 });

  const redeemed = await redeemPasscode(String(form.get('passcode') ?? ''));
  if (!redeemed.ok) return NextResponse.json({ error: redeemed.reason }, { status: 403 });

  const image = form.get('image');
  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Product image is required.' }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return NextResponse.json({ error: 'Image must be PNG, JPEG or WebP.' }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image must be 10MB or smaller.' }, { status: 400 });
  }

  const brief = readBrief(form);
  if (!brief.product_name) {
    return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const user = token ? await userFromToken(token) : null;

  const bytes = Buffer.from(await image.arrayBuffer());
  const extension = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${randomUUID()}.${extension}`;

  let imageUrl: string;
  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    const { error } = await db.storage
      .from('product-images')
      .upload(filename, bytes, { contentType: image.type, upsert: false });
    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 502 });
    }
    imageUrl = db.storage.from('product-images').getPublicUrl(filename).data.publicUrl;
  } else {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), bytes);
    imageUrl = `/api/uploads/${filename}`;
  }

  const job = await createJob({
    user_id: user?.id ?? null,
    passcode_id: redeemed.passcodeId,
    tier: String(form.get('tier') ?? 'business'),
    credit_budget: Number(form.get('creditBudget') ?? 11),
    product_image_url: imageUrl,
    intake_brief: brief,
  });

  return NextResponse.json({ job_id: job.id, status: job.status }, { status: 201 });
}

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const user = token ? await userFromToken(token) : null;
  const jobs = await listJobs(user?.id ?? null);
  return NextResponse.json({ jobs });
}

function readBrief(form: FormData): IntakeBrief {
  const text = (key: string) => String(form.get(key) ?? '').trim();
  const platforms = text('platforms')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const language = text('language');
  return {
    product_name: text('productName'),
    brand_name: text('brandName'),
    category: text('category'),
    target_customer: text('targetCustomer'),
    product_benefits: text('productBenefits'),
    unique_selling_point: text('uniqueSellingPoint'),
    offer: text('offer'),
    platforms: platforms.length ? platforms : ['tiktok'],
    language: language === 'ms' || language === 'zh' ? language : 'en',
    brand_tone: text('brandTone'),
    competitors: text('competitors'),
    missing_specs: text('missingSpecs'),
  };
}
