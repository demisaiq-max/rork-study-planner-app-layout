// Small helper to safely parse responses expected to be JSON.
// It reads the response as text first so we can provide a helpful error
// message when the server returns HTML (which starts with '<').
export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  // Read as text first so we can inspect and provide a clear error.
  const text = await response.text();

  // Quick heuristics: content-type or starting character.
  const looksLikeJson = contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[');

  if (!looksLikeJson) {
    // Truncate body to keep error messages small
    const preview = text.slice(0, 500);
    throw new Error(`Expected JSON response but got content-type='${contentType || 'unknown'}'. Body preview: ${preview}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (err: any) {
    const preview = text.slice(0, 500);
    throw new Error(`Invalid JSON response: ${err?.message || String(err)}. Body preview: ${preview}`);
  }
}

export function isJsonContentType(contentType?: string | null) {
  return !!(contentType && contentType.includes('application/json'));
}
