import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Resume Builder",
  description: "Evidence-grounded resume tailoring with local LaTeX compilation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable, geistMono.variable, "font-sans", dmSans.variable, geistHeading.variable)}>
      {/*
        THESIS: A resume review desk, not an AI dashboard; evidence and document output share the viewport.
        OWN-WORLD: Near-black zinc surfaces, hairline dividers, paper-white preview, restrained green state signals.
        STORY: Import, verify, edit, review atomic proposals, compile, and export without surrendering control.
        FIRST VIEWPORT: Quiet rail, dense editor, live document pane; Compile is the persistent primary action.
        FORM: Code-first Operate workspace, resume-review-desk-code-v1.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
      */}
      <body data-design-contract="resume-review-desk-code-v1" className="antialiased">
        <AppProviders>{children}</AppProviders>
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
