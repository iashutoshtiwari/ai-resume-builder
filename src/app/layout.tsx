import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AppProviders } from "@/components/app-providers";
import { JsonLd } from "@/features/seo/json-ld";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSansHeading = DM_Sans({subsets:['latin'],variable:'--font-heading'});
const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AI Resume Builder — Evidence-Grounded LaTeX Resume Tailoring",
    template: "%s | AI Resume Builder",
  },
  description:
    "Evidence-grounded resume tailoring with ATS-ready LaTeX generation. Import PDF or DOCX, match against job postings, review proposals, and compile through a dedicated TeX service.",
  applicationName: "AI Resume Builder",
  authors: [{ name: "AI Resume Builder Team" }],
  creator: "AI Resume Builder",
  publisher: "AI Resume Builder",
  keywords: [
    "AI resume builder",
    "LaTeX resume",
    "ATS friendly resume",
    "evidence grounded resume tailoring",
    "LaTeX resume compiler",
    "ATS resume PDF",
    "local resume builder",
    "open source resume builder",
    "ATS resume optimizer",
  ],
  category: "Productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "AI Resume Builder",
    title: "AI Resume Builder — Evidence-Grounded LaTeX Resume Tailoring",
    description:
      "Evidence-grounded resume tailoring and ATS-ready LaTeX generation. Match job descriptions without inventing experience.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Builder — Evidence-Grounded LaTeX Resume Tailoring",
    description:
      "Evidence-grounded resume tailoring and ATS-ready LaTeX generation. Match job descriptions without inventing experience.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable, geistMono.variable, "font-sans", inter.variable, dmSansHeading.variable)}>
      <head>
        <JsonLd />
      </head>
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
