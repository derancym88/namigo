import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Temporary JSON-file store used when Supabase keys are absent.
 *
 * The manual is explicit that this is VPS test mode only; once the Supabase
 * project is connected, every read and write goes to Postgres instead.
 */

async function ensureDir(file: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await ensureDir(file);
  // Write through a temp file so a crash mid-write cannot truncate the store.
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, file);
}
