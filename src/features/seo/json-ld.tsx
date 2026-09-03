import React from "react";

export function JsonLd() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AI Resume Builder",
    url: baseUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "All (Web Browser with WebAssembly)",
    browserRequirements: "Requires HTML5, Web Workers, and WebAssembly",
    description:
      "Evidence-grounded resume tailoring workspace. Ingest PDF or DOCX resumes, match against job descriptions, review atomic diffs with zero hallucinations, and compile ATS-ready LaTeX PDFs locally via WebAssembly.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Evidence-grounded AI bullet tailoring with hallucination safeguards",
      "Client-side LaTeX compilation via Siglum WebAssembly and TeX Live",
      "Multi-format ingestion: PDF, Word DOCX, LaTeX, and plain text",
      "Standard ATS-compliant single-column resume output",
      "Zero server-side persistence: documents stay in browser IndexedDB",
      "Atomic diff approval workflow",
    ],
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Tailor Your Resume for Any Job with AI and LaTeX",
    description:
      "Step-by-step guide to tailoring your resume with verifiable evidence and compiling an ATS-compliant LaTeX PDF.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Upload Existing Resume",
        text: "Upload your current resume in PDF, Word DOCX, LaTeX (.tex), or plain text format. The app extracts and structures your experience into a clean JSON schema.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Paste Target Job Description",
        text: "Paste the job posting you want to apply for. The system analyzes the requirements, required technical skills, and key responsibilities.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Review Evidence-Grounded Proposals",
        text: "Review atomic tailoring proposals. Every suggested improvement is directly grounded in your verified background and checked against hallucination rules.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Compile Local LaTeX PDF",
        text: "Compile your tailored resume into an ATS-optimized PDF directly inside your browser using the local WebAssembly LaTeX engine.",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Why is LaTeX preferred for Applicant Tracking Systems (ATS)?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LaTeX produces clean, deterministic type-setting with standardized unicode font glyphs and single-column semantic structures. Unlike complex WYSIWYG builders that produce nested invisible tables or multi-column text boxes, LaTeX PDFs parse cleanly and reliably across all major ATS platforms.",
        },
      },
      {
        "@type": "Question",
        name: "How does evidence-grounded AI prevent resume hallucinations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Before any AI-generated change is presented to the user, it is checked by an automated semantic validator. Every proposed bullet must cite an exact excerpt from the candidate's original resume proving the claim. Suggestions that invent metrics, fabricate companies, or claim unproven skills are rejected at the validator layer.",
        },
      },
      {
        "@type": "Question",
        name: "Are my resumes or contact details stored on remote servers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Your resumes, edit history, and compiled PDFs are persisted entirely in your browser using IndexedDB. Text is only sent to the configured AI provider (Google Gemini or OpenRouter) during active parse, analysis, or tailoring requests, and is never retained in a remote database.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need TeX Live or Overleaf installed on my machine?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No installation is required. AI Resume Builder bundles Siglum WebAssembly with TeX Live packages that run directly inside a background Web Worker in modern web browsers.",
        },
      },
      {
        "@type": "Question",
        name: "What file formats can I upload?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can upload resumes in PDF format, Microsoft Word (.docx), LaTeX (.tex), or plain text (.txt). You can also load our pre-configured software engineer sample resume to test the workspace immediately.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
