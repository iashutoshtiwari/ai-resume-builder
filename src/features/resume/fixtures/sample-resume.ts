import type { Resume } from "@/features/resume/schema";

export const sampleResume: Resume = {
  version: 1,
  basics: {
    name: "Alex Morgan",
    headline: "Software Engineer",
    email: "alex.morgan@example.com",
    phone: "+1 555 010 2020",
    location: "Austin, TX",
    links: [
      { id: "link-portfolio", label: "alexmorgan.dev", url: "https://example.com" },
      { id: "link-github", label: "github.com/alexmorgan", url: "https://github.com" },
    ],
  },
  skills: [
    { id: "skills-languages", name: "Languages", skills: [{ id: "skill-typescript", name: "TypeScript" }, { id: "skill-python", name: "Python" }] },
    { id: "skills-web", name: "Web", skills: [{ id: "skill-react", name: "React" }, { id: "skill-next", name: "Next.js" }, { id: "skill-rest", name: "REST APIs" }] },
  ],
  experience: [
    {
      id: "experience-example",
      company: "Example Corp",
      role: "Frontend Engineer",
      location: "Austin, TX",
      startDate: "August 2021",
      endDate: "Present",
      bullets: [
        { id: "bullet-design-system", text: "Built reusable React and TypeScript components for an enterprise analytics dashboard." },
        { id: "bullet-api", text: "Integrated REST APIs and improved error handling across customer-facing workflows." },
        { id: "bullet-ci", text: "Maintained Jenkins checks used by the frontend team during pull request review." },
      ],
    },
  ],
  projects: [
    {
      id: "project-resume",
      name: "Document Studio",
      description: "Browser-based document editing experiment",
      technologies: [{ id: "tech-react", name: "React" }, { id: "tech-wasm", name: "WebAssembly" }],
      links: [{ id: "project-link", label: "github.com/alexmorgan/document-studio", url: "https://github.com" }],
      bullets: [{ id: "project-bullet", text: "Created a structured editor that renders documents through deterministic templates." }],
    },
  ],
  education: [
    {
      id: "education-state",
      institution: "State University",
      degree: "BS in Computer Science",
      endDate: "May 2021",
      details: [],
    },
  ],
};
