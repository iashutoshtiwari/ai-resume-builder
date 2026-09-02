export type SupportedFormat = "pdf" | "docx" | "latex" | "text";

export interface ExtractedDocument {
  text: string;
  format: SupportedFormat;
  filename: string;
  pageCount?: number;
}

/**
 * Extract plain text from a PDF ArrayBuffer / Uint8Array using pdfjs-dist.
 */
async function extractTextFromPdf(data: ArrayBuffer | Uint8Array): Promise<{ text: string; pages: number }> {
  const pdfjs = await import("pdfjs-dist");
  
  if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const typedArray = data instanceof Uint8Array ? data : new Uint8Array(data);
  const loadingTask = pdfjs.getDocument({
    data: typedArray,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    let lastY: number | null = null;
    let pageString = "";

    for (const item of textContent.items) {
      if (!("str" in item) || typeof item.str !== "string" || !item.str) continue;
      const transform = "transform" in item && Array.isArray(item.transform) ? item.transform : null;
      const currentY = transform ? (transform[5] as number) : null;
      
      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
        pageString += "\n";
      } else if (pageString.length > 0 && !pageString.endsWith(" ") && !pageString.endsWith("\n")) {
        pageString += " ";
      }
      
      pageString += item.str;
      if (currentY !== null) lastY = currentY;
    }

    if (pageString.trim()) {
      pageTexts.push(pageString.trim());
    }
  }

  return {
    text: pageTexts.join("\n\n--- Page Break ---\n\n"),
    pages: pdfDoc.numPages,
  };
}

/**
 * Extract raw text from a DOCX ArrayBuffer using mammoth.
 */
async function extractTextFromDocx(data: ArrayBuffer | Uint8Array): Promise<string> {
  const mammoth = (await import("mammoth")) as unknown as {
    extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: unknown[] }>;
  };

  const buffer = data instanceof ArrayBuffer ? data : (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value.trim();
}

/**
 * Detect file type and extract text from an uploaded File object in the browser.
 */
export async function extractTextFromFile(file: File): Promise<ExtractedDocument> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const filename = file.name;

  if (extension === "pdf") {
    const buffer = await file.arrayBuffer();
    const { text, pages } = await extractTextFromPdf(buffer);
    return {
      text,
      format: "pdf",
      filename,
      pageCount: pages,
    };
  }

  if (extension === "doc") {
    throw new Error("Legacy .doc files are not supported. Open the file in Word and save it as .docx first.");
  }

  if (extension === "docx") {
    const buffer = await file.arrayBuffer();
    const text = await extractTextFromDocx(buffer);
    return {
      text,
      format: "docx",
      filename,
    };
  }

  if (extension === "tex") {
    const text = await file.text();
    return {
      text,
      format: "latex",
      filename,
    };
  }

  if (extension === "txt" || file.type === "text/plain" || extension === "") {
    const text = await file.text();
    return {
      text,
      format: "text",
      filename,
    };
  }

  throw new Error("Unsupported resume format. Upload PDF, DOCX, LaTeX, or plain text.");
}
