import http from "node:http";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT) || 8080;
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_BYTES = 200 * 1024;
const MAX_FILES = 40;
const COMPILE_TIMEOUT_MS = 25_000;

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(json),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(json);
}

function parseLatexErrors(logs) {
  const errors = [];
  const lines = logs.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for standard LaTeX error format "! Error message"
    if (line.startsWith("! ")) {
      const message = line.slice(2).trim();
      let lineNum;

      // Look ahead for "l.<number>" pattern in the next few lines
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const lineMatch = lines[j].match(/^l\.(\d+)/);
        if (lineMatch) {
          lineNum = Number.parseInt(lineMatch[1], 10);
          break;
        }
      }

      const lowerMessage = message.toLowerCase();
      errors.push({
        code: lowerMessage.includes("file `") && lowerMessage.includes("not found") ? "unsupported-package" : "latex",
        message: lowerMessage.includes("undefined control sequence") ? "There's an invalid LaTeX command in this document." : lowerMessage.includes("not found") ? "This document uses a LaTeX package or file that isn't available in the current compiler." : "We couldn't compile this LaTeX document.",
        line: lineNum,
      });
    }

    // Check for file-line-error format: "main.tex:12: Error message"
    const fileLineMatch = line.match(/^(?:main\.tex|.*\.tex):(\d+):\s*(.+)$/i);
    if (fileLineMatch) {
      errors.push({
        code: "latex",
        line: Number.parseInt(fileLineMatch[1], 10),
        message: fileLineMatch[2].trim(),
      });
    }
  }

  if (errors.length === 0) {
    // Check for generic error keywords if no standard pattern found
    const lower = logs.toLowerCase();
    let code = "latex";
    if (lower.includes("not found") || lower.includes("missing package")) {
      code = "unsupported-package";
    } else if (lower.includes("memory") || lower.includes("capacity exceeded")) {
      code = "memory";
    }

    errors.push({
      code,
      message: code === "unsupported-package" ? "This document uses a LaTeX package or file that isn't available in the current compiler." : "We couldn't compile this LaTeX document.",
    });
  }

  return errors;
}

async function handleCompile(req, res) {
  let body = "";
  let bytesReceived = 0;

  for await (const chunk of req) {
    bytesReceived += chunk.length;
    if (bytesReceived > MAX_PAYLOAD_BYTES) {
    sendJson(res, 413, { success: false, errors: [{ code: "resource-limit", message: "This LaTeX document is too large to compile." }], logs: "" });
      return;
    }
    body += chunk;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    sendJson(res, 400, { success: false, errors: [{ code: "runtime", message: "The compilation request was invalid." }], logs: "" });
    return;
  }

  const { source, engine = "pdflatex", files } = payload;
  if (!source || typeof source !== "string") {
    sendJson(res, 400, { success: false, errors: [{ code: "runtime", message: "A LaTeX source document is required." }], logs: "" });
    return;
  }
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) {
    sendJson(res, 413, { success: false, errors: [{ code: "resource-limit", message: "This LaTeX document is too large to compile." }], logs: "" });
    return;
  }
  if (files && (!Array.isArray(files) || files.length > MAX_FILES)) {
    sendJson(res, 400, { success: false, errors: [{ code: "resource-limit", message: "Too many supporting files were provided for this compilation." }], logs: "" });
    return;
  }

  const supportedEngines = ["pdflatex", "xelatex"];
  const selectedEngine = supportedEngines.includes(engine) ? engine : "pdflatex";

  // Create disposable compilation folder
  const compileDir = path.join(os.tmpdir(), `compile-${crypto.randomUUID()}`);
  await fs.mkdir(compileDir, { recursive: true });

  try {
    // Write primary source file
    await fs.writeFile(path.join(compileDir, "main.tex"), source, "utf8");

    // Write auxiliary files (fonts, images, .sty, etc.)
    if (files) {
      const entries = Array.isArray(files)
        ? files.map((f) => [f.name, f.content])
        : Object.entries(files);

      for (const [name, content] of entries) {
        if (!name || typeof name !== "string") continue;
        if (name !== path.basename(name)) continue;
        const safeName = path.basename(name);
        const targetPath = path.join(compileDir, safeName);

        // Security check: ensure path stays within compileDir
        if (!targetPath.startsWith(compileDir)) continue;

        if (typeof content === "string") {
          // Detect base64 data URI or raw string
          if (content.startsWith("data:")) {
            const base64Data = content.split(",")[1] ?? "";
            await fs.writeFile(targetPath, Buffer.from(base64Data, "base64"));
          } else {
            await fs.writeFile(targetPath, content, "utf8");
          }
        } else if (Array.isArray(content)) {
          await fs.writeFile(targetPath, Buffer.from(content));
        } else if (Buffer.isBuffer(content)) {
          await fs.writeFile(targetPath, content);
        }
      }
    }

    // Prepare latexmk compilation args
    const engineArg = selectedEngine === "xelatex" ? "-xelatex" : "-pdf";
    const args = [
      engineArg,
      "-interaction=nonstopmode",
      "-halt-on-error",
      "-file-line-error",
      "-no-shell-escape",
      "main.tex",
    ];

    const { logs, timedOut } = await new Promise((resolve) => {
      let output = "";
      let timedOut = false;
      const proc = spawn("latexmk", args, {
        cwd: compileDir,
      });

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGKILL");
      }, COMPILE_TIMEOUT_MS);

      proc.stdout.on("data", (data) => {
        if (output.length < 500_000) output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        if (output.length < 500_000) output += data.toString();
      });

      proc.on("error", (err) => {
        output += `\nProcess execution error: ${err.message}`;
        clearTimeout(timer);
        resolve({ logs: output, timedOut });
      });

      proc.on("close", () => {
        clearTimeout(timer);
        resolve({ logs: output, timedOut });
      });
    });

    const pdfPath = path.join(compileDir, "main.pdf");
    const pdfExists = existsSync(pdfPath);

    if (pdfExists) {
      const pdfBuffer = await fs.readFile(pdfPath);
      if (pdfBuffer.byteLength > 0) {
        sendJson(res, 200, {
          success: true,
          pdf: pdfBuffer.toString("base64"),
          logs,
        });
        return;
      }
    }

    // If PDF was not produced, extract compiler errors
    let fullLogs = logs;
    const logFilePath = path.join(compileDir, "main.log");
    if (existsSync(logFilePath)) {
      try {
        const fileLogs = await fs.readFile(logFilePath, "utf8");
        fullLogs = fileLogs;
      } catch {
        // use output logs
      }
    }

    const errors = timedOut
      ? [{ code: "timeout", message: "PDF compilation took too long and was stopped." }]
      : parseLatexErrors(fullLogs);
    sendJson(res, 200, {
      success: false,
      errors,
      logs: fullLogs,
    });
  } catch {
    sendJson(res, 500, {
      success: false,
      errors: [{ code: "runtime", message: "The PDF compiler could not complete this request." }],
      logs: "",
    });
  } finally {
    // Disposable cleanup: always delete temp compilation directory
    try {
      await fs.rm(compileDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === "GET" && (pathname === "/health" || pathname === "/")) {
    sendJson(res, 200, {
      status: "ok",
      service: "resume-latex-compiler",
      engines: ["pdflatex", "xelatex"],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Compilation endpoint
  if (req.method === "POST" && pathname === "/compile") {
    await handleCompile(req, res);
    return;
  }

  // Fallback 404
  sendJson(res, 404, { error: "Not Found", message: `Cannot ${req.method} ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`[resume-latex-compiler] Listening on port ${PORT}`);
});
