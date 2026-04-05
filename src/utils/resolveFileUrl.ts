/**
 * Resolves an image/file URL.
 * - If the URL starts with "http", it's already a full Supabase URL → return as-is.
 * - If it starts with "/uploads/", it's a local file → prepend the backend base URL.
 * - Otherwise return as-is.
 */
export function resolveFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${path}`;
  return path;
}
