import React from "react";
import { siteConfig } from "@/config/site";

export function JsonLd() {
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.canonical,
    description: siteConfig.description,
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.canonical,
    description: siteConfig.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    featureList: [
      "Resume parsing from PDF, DOCX, LaTeX, and text",
      "Software engineering resume structuring",
      "Evidence-grounded resume tailoring to target job descriptions",
      "Factual accuracy safeguards without hallucinating experience",
      "Deterministic single-column LaTeX resume rendering",
      "ATS-friendly PDF compilation",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
    </>
  );
}
