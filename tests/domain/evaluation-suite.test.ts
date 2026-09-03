import { describe, expect, it } from "vitest";
import {
  assessJobMatch,
  assessResume,
  detectCareerStage,
  getRecommendedSections,
} from "@/features/assessment/scoring";
import {
  blockerJob,
  criticalTestCaseJob,
} from "@/features/jobs/fixtures/evaluation-jobs";
import { renderResumeToLatex } from "@/features/latex/renderer";
import { DEFAULT_PRESENTATION, type RenderedSection } from "@/features/presentation/schema";
import {
  criticalTestCaseResume,
  studentCandidateResume,
} from "@/features/resume/fixtures/evaluation-fixtures";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import { validateResumeAgainstEvidence } from "@/lib/ai/factuality-validator";

describe("v0.2 Domain Evaluation Suite (Sections 77–81)", () => {
  // SECTION 77: CRITICAL TEST CASE
  describe("Section 77: Critical Test Case", () => {
    it("delineates exact, transferable, and unsupported requirements correctly", () => {
      const result = assessJobMatch(criticalTestCaseResume, criticalTestCaseJob);

      const matchMap = new Map(result.matches.map((m) => [m.requirementId, m]));

      // 1. Docker is supported as an exact match
      expect(matchMap.get("req-docker")?.status).toBe("exact");

      // 2. CI/CD is supported as transferable / partial via GitHub Actions evidence
      expect(matchMap.get("req-cicd")?.status).toBe("transferable");

      // 3. Kubernetes, Go, AWS, Kafka, Redis are categorized as unsupported / gaps
      expect(matchMap.get("req-k8s")?.status).toBe("not-represented");
      expect(matchMap.get("req-go")?.status).toBe("not-represented");
      expect(matchMap.get("req-aws")?.status).toBe("not-represented");
      expect(matchMap.get("req-kafka")?.status).toBe("not-represented");
      expect(matchMap.get("req-redis")?.status).toBe("not-represented");
    });

    it("factuality validator flags any proposed resume that fabricates AWS or Kubernetes", () => {
      // Fabricated resume: claims AWS and Kubernetes with no candidate evidence
      const fabricatedResume = {
        ...criticalTestCaseResume,
        skills: [
          ...criticalTestCaseResume.skills,
          {
            id: "grp-cloud",
            name: "Cloud",
            skills: [
              { id: "sk-aws", name: "AWS" },
              { id: "sk-k8s", name: "Kubernetes" },
            ],
          },
        ],
      };

      const validation = validateResumeAgainstEvidence(
        fabricatedResume,
        criticalTestCaseResume,
      );
      expect(validation.valid).toBe(false);
      expect(validation.violations.some((v) => v.message.includes("AWS"))).toBe(true);
      expect(validation.violations.some((v) => v.message.includes("Kubernetes"))).toBe(true);
    });

    it("factuality validator rejects invented metrics in experience bullets", () => {
      const fabricatedBulletResume = {
        ...criticalTestCaseResume,
        experience: [
          {
            ...criticalTestCaseResume.experience[0],
            bullets: [
              ...criticalTestCaseResume.experience[0].bullets,
              {
                id: "exp-fake-b",
                text: "Increased company quarterly revenue by $2.5M by migrating data systems.",
              },
            ],
          },
        ],
      };

      const validation = validateResumeAgainstEvidence(
        fabricatedBulletResume,
        criticalTestCaseResume,
      );
      expect(validation.valid).toBe(false);
      expect(validation.violations.some((v) => v.code === "invented-metric")).toBe(true);
    });
  });

  // SECTION 78: TRANSFERABILITY VS EXACT MATCH
  describe("Section 78: Transferability & Logically Implied Evidence", () => {
    it("recognizes Next.js implies React without falsely claiming identical products", () => {
      const nextResume = {
        ...sampleResume,
        skills: [
          {
            id: "grp-web",
            name: "Web",
            skills: [{ id: "sk-next", name: "Next.js" }],
          },
        ],
        experience: [],
        projects: [],
      };

      const jobAskingForReact = {
        summary: "React role",
        keywords: [],
        primaryResponsibilities: [],
        senioritySignals: [],
        domainSignals: [],
        requirements: [
          {
            id: "req-react",
            text: "React",
            category: "technology" as const,
            importance: "required" as const,
          },
        ],
      };

      const result = assessJobMatch(nextResume, jobAskingForReact);
      expect(result.matches[0].status).toBe("transferable");
      expect(result.matches[0].explanation).toContain("not claimed as an exact technology match");
    });

    it("does not equate RabbitMQ to Kafka as an exact match", () => {
      const result = assessJobMatch(criticalTestCaseResume, {
        summary: "Kafka role",
        keywords: [],
        primaryResponsibilities: [],
        senioritySignals: [],
        domainSignals: [],
        requirements: [
          {
            id: "req-kafka",
            text: "Kafka",
            category: "technology" as const,
            importance: "required" as const,
          },
        ],
      });
      // Should not be exact match
      expect(result.matches[0].status).not.toBe("exact");
    });
  });

  // SECTION 79: STUDENT VS EXPERIENCED CANDIDATES
  describe("Section 79: Career Stage Segmentation", () => {
    it("classifies students correctly and recommends projects & education priority", () => {
      const detected = detectCareerStage(studentCandidateResume);
      expect(detected).toBe("student");

      const recs = getRecommendedSections("student", studentCandidateResume);
      // For student without full-time experience, education and projects should be upfront
      expect(recs.recommended).toContain("education");
      expect(recs.recommended).toContain("projects");
      expect(recs.recommended).toContain("skills");
      expect(recs.recommended[0]).toBe("education");
    });

    it("classifies experienced engineer and recommends work experience first", () => {
      const detected = detectCareerStage(sampleResume);
      expect(detected).toBe("mid-level");

      const recs = getRecommendedSections("mid-level", sampleResume);
      expect(recs.recommended[0]).toBe("experience");
    });

    it("fairly scores students with strong projects without penalizing for lack of 5+ YoE", () => {
      const studentAssessment = assessResume(studentCandidateResume);
      // Content and technical signal should be rewarded for the project
      expect(studentAssessment.quality).toBeGreaterThanOrEqual(45);
      expect(studentAssessment.ats).toBeGreaterThanOrEqual(75);
    });
  });

  // SECTION 80: SECTION ORDERING & DETERMINISTIC LATEX
  describe("Section 80: Dynamic Section Ordering & LaTeX Rendering", () => {
    it("renders summary, certifications, and achievements when provided", () => {
      const fullResume = {
        ...sampleResume,
        summary: "Results-driven software engineer specialized in distributed cloud systems.",
        certifications: [
          {
            id: "cert-aws",
            name: "AWS Certified Solutions Architect",
            issuer: "Amazon Web Services",
            date: "2024",
          },
        ],
        achievements: [
          {
            id: "ach-hack",
            title: "1st Place Winner - National Hackathon",
            date: "2023",
            description: "Built real-time telemetry indexing system.",
          },
        ],
      };

      const presentation = {
        ...DEFAULT_PRESENTATION,
        sections: [
          "summary",
          "experience",
          "skills",
          "projects",
          "education",
          "certifications",
          "achievements",
        ] as RenderedSection[],
      };

      const latex = renderResumeToLatex(fullResume, presentation);

      expect(latex).toContain("\\section*{Summary}");
      expect(latex).toContain("Results-driven software engineer");
      expect(latex).toContain("\\section*{Certifications}");
      expect(latex).toContain("AWS Certified Solutions Architect");
      expect(latex).toContain("\\section*{Achievements}");
      expect(latex).toContain("1st Place Winner - National Hackathon");

      // Verify order: Summary appears before Experience
      const summaryPos = latex.indexOf("\\section*{Summary}");
      const expPos = latex.indexOf("\\section*{Experience}");
      const certPos = latex.indexOf("\\section*{Certifications}");
      expect(summaryPos).toBeLessThan(expPos);
      expect(expPos).toBeLessThan(certPos);
    });

    it("omits empty optional sections cleanly from LaTeX output", () => {
      const latex = renderResumeToLatex(sampleResume, DEFAULT_PRESENTATION);
      expect(latex).not.toContain("\\section*{Summary}");
      expect(latex).not.toContain("\\section*{Certifications}");
      expect(latex).not.toContain("\\section*{Achievements}");
    });
  });

  // SECTION 81: HARD BLOCKERS & STABLE SCORING
  describe("Section 81: Blocker Signals & Scoring Stability", () => {
    it("flags hard blockers and sets recommendation to Likely Blocked", () => {
      const result = assessJobMatch(sampleResume, blockerJob);
      expect(result.recommendation).toBe("Likely Blocked");
      expect(result.alignment).toBe("low");
      expect(result.groups.blockers.length).toBeGreaterThan(0);
    });

    it("produces deterministic scoring across multiple executions", () => {
      const run1 = assessJobMatch(criticalTestCaseResume, criticalTestCaseJob);
      const run2 = assessJobMatch(criticalTestCaseResume, criticalTestCaseJob);
      expect(run1.score).toBe(run2.score);
      expect(run1.recommendation).toBe(run2.recommendation);
      expect(run1.alignment).toBe(run2.alignment);
      expect(run1.matches).toEqual(run2.matches);
    });
  });
});
