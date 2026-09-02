// Siglum uses this only for browser-cache keys. Its optional BLAKE3 browser
// artifact is incomplete in v2.1.5, so provide a deterministic non-security hash.
export function hash(input: string | Uint8Array, options?: { length?: number }) {
  const text = typeof input === "string" ? input : new TextDecoder().decode(input);
  let value = 5381 >>> 0;
  for (let index = 0; index < text.length; index += 1) value = ((value * 33) ^ text.charCodeAt(index)) >>> 0;
  const hex = value.toString(16).padStart(8, "0").repeat(Math.max(1, Math.ceil((options?.length ?? 8) / 4))).slice(0, (options?.length ?? 8) * 2);
  return { toString: (encoding?: string) => encoding === "hex" || !encoding ? hex : hex };
}
