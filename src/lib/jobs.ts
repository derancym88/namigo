import { randomUUID } from 'node:crypto';
import { jobStorePath, supabaseAdminEnabled } from './config';
import { readJson, writeJson } from './filestore';
import { serviceClient } from './supabase';
import type { JobStatus } from './workflow';

/** Customer intake brief captured at /jobs/new. */
export type IntakeBrief = {
  product_name: string;
  brand_name: string;
  category: string;
  target_customer: string;
  product_benefits: string;
  unique_selling_point: string;
  offer: string;
  platforms: string[];
  language: 'en' | 'ms' | 'zh';
  brand_tone: string;
  competitors: string;
  missing_specs: string;
};

export type Job = {
  id: string;
  user_id: string | null;
  passcode_id: string | null;
  status: JobStatus;
  tier: string;
  credit_budget: number;
  credits_used: number;
  product_image_url: string;
  intake_brief: IntakeBrief;
  product_analysis: unknown | null;
  market_research: unknown | null;
  copy_data: unknown | null;
  image_urls: string[] | null;
  video_url: string | null;
  launch_kit: unknown | null;
  export_manifest: unknown | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type NewJob = Pick<
  Job,
  'user_id' | 'passcode_id' | 'tier' | 'credit_budget' | 'product_image_url' | 'intake_brief'
>;

export async function createJob(input: NewJob): Promise<Job> {
  const now = new Date().toISOString();
  const job: Job = {
    id: randomUUID(),
    status: 'uploaded',
    credits_used: 0,
    product_analysis: null,
    market_research: null,
    copy_data: null,
    image_urls: null,
    video_url: null,
    launch_kit: null,
    export_manifest: null,
    error_message: null,
    created_at: now,
    updated_at: now,
    ...input,
  };

  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    const { error } = await db.from('jobs').insert(job);
    if (error) throw new Error(`job insert failed: ${error.message}`);
    return job;
  }

  const all = await readJson<Job[]>(jobStorePath, []);
  all.push(job);
  await writeJson(jobStorePath, all);
  return job;
}

export async function getJob(id: string): Promise<Job | null> {
  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    const { data } = await db.from('jobs').select('*').eq('id', id).maybeSingle();
    return (data as Job) ?? null;
  }
  const all = await readJson<Job[]>(jobStorePath, []);
  return all.find((j) => j.id === id) ?? null;
}

export async function listJobs(userId: string | null): Promise<Job[]> {
  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    let query = db.from('jobs').select('*').order('created_at', { ascending: false }).limit(50);
    if (userId) query = query.eq('user_id', userId);
    const { data } = await query;
    return (data ?? []) as Job[];
  }
  const all = await readJson<Job[]>(jobStorePath, []);
  return all
    .filter((j) => (userId ? j.user_id === userId : true))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<Job | null> {
  const next = { ...patch, updated_at: new Date().toISOString() };

  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    const { data, error } = await db.from('jobs').update(next).eq('id', id).select().maybeSingle();
    if (error) throw new Error(`job update failed: ${error.message}`);
    return (data as Job) ?? null;
  }

  const all = await readJson<Job[]>(jobStorePath, []);
  const index = all.findIndex((j) => j.id === id);
  if (index === -1) return null;
  all[index] = { ...all[index], ...next };
  await writeJson(jobStorePath, all);
  return all[index];
}
