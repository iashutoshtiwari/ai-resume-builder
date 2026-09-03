import { describe, expect, it } from "vitest";
import { ResumeSchema } from "@/features/resume/schema";
import {
  extractAndParseJson,
  extractNormalizedResume,
  normalizeRawFullTailoring,
  normalizeRawJobAnalysis,
  normalizeRawProofreadingResponse,
  normalizeRawResume,
  normalizeRawTailoringResponse,
} from "./normalize";


describe("normalizeRawResume", () => {
  it("normalizes an unstructured / lenient LLM output into strict valid ResumeSchema", () => {
    const rawLlmOutput = {
      basics: {
        name: "Jane Doe",
        headline: "Senior Frontend Engineer",
        email: "jane@example.com",
        phone: "+1 555-0100",
        location: "San Francisco, CA",
        links: ["https://github.com/janedoe", "https://linkedin.com/in/janedoe"],
      },
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      experience: [
        {
          company: "Acme Corp",
          role: "Frontend Lead",
          startDate: "2021",
          endDate: "Present",
          bullets: ["Engineered core dashboard application.", "Mentored junior engineers."],
        },
      ],
      projects: [
        {
          name: "Resume Tailor",
          description: "AI-assisted resume editor",
          technologies: ["Next.js", "TypeScript"],
          bullets: ["Built responsive UI."],
        },
      ],
      education: [
        {
          institution: "University of Tech",
          degree: "B.S. in Computer Science",
          details: ["Graduated Magna Cum Laude"],
        },
      ],
    };

    const normalized = normalizeRawResume(rawLlmOutput) as { resume: unknown; warnings: unknown[] };
    expect(normalized).toHaveProperty("resume");
    expect(normalized).toHaveProperty("warnings");

    const parsed = ResumeSchema.safeParse(normalized.resume);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.basics.name).toBe("Jane Doe");
      expect(parsed.data.skills[0].skills[0].name).toBe("React");
      expect(parsed.data.experience[0].bullets[0].text).toBe("Engineered core dashboard application.");
      expect(parsed.data.projects[0].technologies[0].name).toBe("Next.js");
      expect(parsed.data.education[0].details[0].text).toBe("Graduated Magna Cum Laude");
    }
  });

  it("handles duplicate IDs and ensures uniqueness", () => {
    const rawWithDuplicates = {
      resume: {
        basics: { name: "Test User", links: [] },
        skills: [
          { id: "same-id", name: "Skills", skills: [{ id: "same-id", name: "React" }, { id: "same-id", name: "Node" }] },
        ],
        experience: [
          { id: "same-id", company: "A", role: "Dev", startDate: "2020", endDate: "2021", bullets: [{ id: "same-id", text: "Bullet 1" }] },
        ],
        projects: [],
        education: [],
      },
    };

    const normalized = normalizeRawResume(rawWithDuplicates) as { resume: unknown };
    const parsed = ResumeSchema.safeParse(normalized.resume);
    expect(parsed.success).toBe(true);
  });

  it("does not fabricate missing required resume facts", () => {
    const normalized = normalizeRawResume({
      resume: {
        basics: { links: [{ label: "Missing URL" }] },
        skills: [],
        experience: [{ startDate: "2024", endDate: "Present", bullets: [] }],
        projects: [],
        education: [],
      },
    }) as { resume: unknown };

    expect(ResumeSchema.safeParse(normalized.resume).success).toBe(false);
    expect(JSON.stringify(normalized)).not.toContain("example.com");
    expect(JSON.stringify(normalized)).not.toContain("Candidate");
  });

  it("classifies missing comparison output as unsupported deterministically", () => {
    const raw = {
      analysis: {
        summary: "Role requirements",
        requirements: [
          { id: "duplicate", text: "React", category: "technology", importance: "required" },
          { id: "duplicate", text: "Kubernetes", category: "technology", importance: "preferred" },
        ],
      },
      comparison: { entries: [] },
    };
    const first = normalizeRawJobAnalysis(raw);
    const second = normalizeRawJobAnalysis(raw);
    expect(first).toEqual(second);
    expect((first as { comparison: { entries: Array<{ status: string }> } }).comparison.entries.every((entry) => entry.status === "unsupported")).toBe(true);
  });
});

describe("extractAndParseJson", () => {
  it("extracts JSON from plain, fenced, or conversational AI responses", () => {
    const directJson = '{"key": "value"}';
    expect(extractAndParseJson(directJson)).toEqual({ key: "value" });

    const fencedJson = 'Here is your structured resume:\n```json\n{"resume": {"version": 1}}\n```\nHope that helps!';
    expect(extractAndParseJson(fencedJson)).toEqual({ resume: { version: 1 } });

    const reasoningJson = '<think>I should parse this resume into JSON</think>```\n{"result": "ok"}\n```';
    expect(extractAndParseJson(reasoningJson)).toEqual({ result: "ok" });

    const trailingCommaJson = '{"items": [1, 2, ], "name": "test", }';
    expect(extractAndParseJson(trailingCommaJson)).toEqual({ items: [1, 2], name: "test" });
  });
});

describe("Specialized AI Response Normalizers", () => {
  it("normalizes a raw array or wrapped object into valid TailoringResponse structure", () => {
    const rawArray = [
      { id: "chg-1", target: "basics-headline", before: "A", after: "B" },
    ];
    const fromArray = normalizeRawTailoringResponse(rawArray) as { changes: unknown[]; gaps: unknown[] };
    expect(fromArray.changes).toHaveLength(1);
    expect(fromArray.gaps).toEqual([]);

    const wrapped = {
      data: {
        changes: [{ id: "chg-2" }],
        gaps: [{ id: "gap-1" }],
      },
    };
    const fromWrapped = normalizeRawTailoringResponse(wrapped) as { changes: unknown[]; gaps: unknown[] };
    expect(fromWrapped.changes).toHaveLength(1);
    expect(fromWrapped.gaps).toHaveLength(1);
  });

  it("normalizes a raw array or wrapped object into valid ProofreadingResponse structure", () => {
    const rawArray = [
      { id: "prf-1", target: "basics-headline", before: "A", after: "B" },
    ];
    const fromArray = normalizeRawProofreadingResponse(rawArray) as { changes: unknown[] };
    expect(fromArray.changes).toHaveLength(1);

    const wrapped = {
      result: {
        corrections: [{ id: "prf-2" }],
      },
    };
    const fromWrapped = normalizeRawProofreadingResponse(wrapped) as { changes: unknown[] };
    expect(fromWrapped.changes).toHaveLength(1);
  });

  it("normalizes full tailoring response providing fallback summary and unwrapped resume", () => {
    const raw = {
      tailoredResume: {
        basics: { name: "Test Candidate" },
        skills: [],
        experience: [],
        projects: [],
        education: [],
      },
    };

    const normalized = normalizeRawFullTailoring(raw) as {
      tailoredResume: { version: number; basics: { name: string } };
      summary: string;
      changes: unknown[];
      gaps: unknown[];
    };

    expect(normalized.tailoredResume.version).toBe(1);
    expect(normalized.tailoredResume.basics.name).toBe("Test Candidate");
    expect(normalized.summary).toContain("Tailored resume");
    expect(normalized.changes).toEqual([]);
    expect(normalized.gaps).toEqual([]);
  });

  it("extractNormalizedResume extracts inner resume when wrapped or unwrapped", () => {
    const rawResume = {
      basics: { name: "Direct Name" },
      skills: [],
      experience: [],
      projects: [],
      education: [],
    };
    const extracted = extractNormalizedResume(rawResume) as { basics: { name: string } };
    expect(extracted.basics.name).toBe("Direct Name");
  });
});

