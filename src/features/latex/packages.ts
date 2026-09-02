export const LATEX_PACKAGE_ASSETS = [
  "titlesec.sty",
  "titleps.sty",
  "enumitem.sty",
  "XCharter.sty",
  "fontaxes.sty",
  "T1XCharter-TLF.fd",
  "XCharter.map",
  "xch_rydp4l.enc",
  "xkeyval.sty",
  "keyval.tex",
  "xkeyval.tex",
  "xkvtxhdr.tex",
  "xkvutils.tex",
  "xstring.sty",
  "xstring.tex",
  "mweights.sty",
  "XCharter-Roman-tlf-t1.vf",
  "XCharter-Bold-tlf-t1.vf",
  "XCharter-Italic-tlf-t1.vf",
  "XCharter-BoldItalic-tlf-t1.vf",
  "XCharter-Roman-tlf-t1.tfm",
  "XCharter-Bold-tlf-t1.tfm",
  "XCharter-Italic-tlf-t1.tfm",
  "XCharter-BoldItalic-tlf-t1.tfm",
  "XCharter-Roman-tlf-t1--base.tfm",
  "XCharter-Bold-tlf-t1--base.tfm",
  "XCharter-Italic-tlf-t1--base.tfm",
  "XCharter-BoldItalic-tlf-t1--base.tfm",
  "XCharter-Roman.pfb",
  "XCharter-Bold.pfb",
  "XCharter-Italic.pfb",
  "XCharter-BoldItalic.pfb",
] as const;

let packageFilesCache: Record<string, Uint8Array | string> | null = null;
let loadPromise: Promise<Record<string, Uint8Array | string>> | null = null;

export async function loadLatexPackageFiles(): Promise<Record<string, Uint8Array | string>> {
  if (packageFilesCache && Object.keys(packageFilesCache).length > 0) return packageFilesCache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (typeof window === "undefined") return {};
    const results: Record<string, Uint8Array | string> = {};
    const fetches = LATEX_PACKAGE_ASSETS.map(async (filename) => {
      try {
        const response = await fetch(`/latex-packages/${filename}`);
        if (!response.ok) return;
        if (
          filename.endsWith(".sty") ||
          filename.endsWith(".tex") ||
          filename.endsWith(".fd") ||
          filename.endsWith(".map") ||
          filename.endsWith(".enc")
        ) {
          results[filename] = await response.text();
        } else {
          const buffer = await response.arrayBuffer();
          results[filename] = new Uint8Array(buffer);
        }
      } catch {
        // Fallback gracefully if an asset fails to fetch
      }
    });

    await Promise.all(fetches);
    packageFilesCache = results;
    return results;
  })();

  return loadPromise;
}
