import { z } from "zod";
import { AppError } from "@/lib/ai/errors";

const pending = new Map<string, Promise<unknown>>();

export async function parseJsonRequest<T>(request: Request, schema: z.ZodType<T>, maxBytes = 240_000): Promise<T> {
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > maxBytes) throw new AppError("PAYLOAD_TOO_LARGE", "The request is larger than the supported limit.", 413, false);
  let text: string;
  try {
    text = await request.text();
  } catch {
    throw new AppError("BAD_REQUEST", "The request body could not be read.", 400, false);
  }
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new AppError("PAYLOAD_TOO_LARGE", "The request is larger than the supported limit.", 413, false);
  }
  try {
    return schema.parse(JSON.parse(text));
  } catch (error) {
    throw new AppError("BAD_REQUEST", "The request body is invalid.", 400, false, error instanceof z.ZodError ? error.flatten() : undefined);
  }
}

export async function dedupeRequest<T>(key: string, action: () => Promise<T>): Promise<T> {
  const existing = pending.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const task = action().finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}

export async function requestKey(kind: string, payload: unknown): Promise<string> {
  const data = new TextEncoder().encode(`${kind}:${JSON.stringify(payload)}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}
