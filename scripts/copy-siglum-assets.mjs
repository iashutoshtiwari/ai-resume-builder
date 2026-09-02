import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(resolve(root, "public"), { recursive: true });
await copyFile(resolve(root, "node_modules/@siglum/engine/src/worker.js"), resolve(root, "public/siglum-worker.js"));
