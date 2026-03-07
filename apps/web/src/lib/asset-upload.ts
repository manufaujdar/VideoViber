import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export type UploadedAssetFile = {
  storagePath: string;
  url: string;
};

const ASSET_BUCKET = 'assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

function sanitizeFileName(fileName: string) {
  const stripped = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return stripped || 'asset';
}

function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}

function resolveUploadPath(userId: string, projectId: string | null | undefined, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const scope = projectId && projectId.trim().length > 0 ? projectId : 'workspace';
  return `${userId}/${scope}/${Date.now()}-${randomToken()}-${safeName}`;
}

function isLikelyPublicUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function isStorageObjectPath(value: string | null | undefined) {
  if (!value) return false;
  return !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:') && !value.startsWith('blob:');
}

export async function resolveAssetUrl(storagePath: string, publicUrl?: string | null) {
  if (publicUrl && publicUrl.length > 0) {
    return publicUrl;
  }

  if (!isStorageObjectPath(storagePath)) {
    return storagePath;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return storagePath;
  }

  const signed = await supabase.storage
    .from(ASSET_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (!signed.error && signed.data?.signedUrl) {
    return signed.data.signedUrl;
  }

  const fallback = supabase.storage.from(ASSET_BUCKET).getPublicUrl(storagePath);
  if (fallback.data.publicUrl && isLikelyPublicUrl(fallback.data.publicUrl)) {
    return fallback.data.publicUrl;
  }

  return storagePath;
}

export async function uploadAssetFile(
  file: File,
  options?: { projectId?: string | null; bucket?: string }
): Promise<UploadedAssetFile> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured for uploads.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('Sign in required before uploading assets.');
  }

  const bucket = options?.bucket || ASSET_BUCKET;
  const path = resolveUploadPath(user.id, options?.projectId, file.name);

  const upload = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const url = await resolveAssetUrl(path);
  return {
    storagePath: path,
    url,
  };
}

export async function removeStoredAsset(storagePath: string, bucket = ASSET_BUCKET) {
  if (!isStorageObjectPath(storagePath)) {
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return;
  }

  const response = await supabase.storage.from(bucket).remove([storagePath]);
  if (response.error) {
    throw new Error(response.error.message);
  }
}
