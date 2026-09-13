import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { uploadsDir } from '@/lib/config';

export const runtime = 'nodejs';

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/** Serves temporary-mode uploads. Supabase Storage replaces this in production. */
export async function GET(_request: Request, { params }: { params: { file: string } }) {
  // Resolve and confine to uploadsDir so a crafted name cannot escape it.
  const target = path.resolve(uploadsDir, params.file);
  if (path.dirname(target) !== path.resolve(uploadsDir)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  try {
    const bytes = await fs.readFile(target);
    return new NextResponse(bytes, {
      headers: { 'content-type': type, 'cache-control': 'private, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
}
