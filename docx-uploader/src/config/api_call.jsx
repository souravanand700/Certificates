// src/config/api_call.jsx

// Default endpoint comes from .env or falls back to localhost
export const ENDPOINT =
  import.meta.env.VITE_API_URL || "https://robotics-dev-1.tensai.run/api/upload";

/**
 * Upload a DOCX to the FastAPI endpoint.
 * @param {File} file - The .docx File object from <input type="file" />
 * @param {object} options
 * @param {string} [options.endpoint=ENDPOINT] - Override endpoint
 * @param {Record<string,string|Blob>} [options.fields] - Extra form fields (optional)
 * @param {HeadersInit} [options.headers] - Extra headers (don’t set Content-Type for multipart)
 * @param {AbortSignal} [options.signal] - Optional AbortController signal
 * @returns {Promise<any>} Parsed JSON if possible, else { raw: string }
 */
export async function uploadDocx(
  file,
  { endpoint = ENDPOINT, fields, headers, signal } = {}
) {
  if (!(file instanceof File)) {
    throw new Error("uploadDocx: invalid file");
  }

  const form = new FormData();
  form.append("file", file, file.name);
  if (fields) {
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
  }

  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
    headers, // do NOT set Content-Type; browser adds boundary for multipart
    signal,
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
