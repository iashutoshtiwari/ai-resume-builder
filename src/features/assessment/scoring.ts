import type { JobAnalysis, JobRequirement } from "@/features/jobs/schema";
import type { RenderedSection } from "@/features/presentation/schema";
import type { CareerStage, Resume } from "@/features/resume/schema";

export type { CareerStage };
export type MatchStatus = "exact" | "transferable" | "partial" | "not-represented" | "blocker";
export type ApplyRecommendation =
  | "Strong Apply"
  | "Apply"
  | "Stretch Apply"
  | "Low Match"
  | "Likely Blocked";

export type ScoreBreakdown = { label: string; score: number; max: number };
export type ResumeAssessment = {
  careerStage: CareerStage;
  careerStageLabel: string;
  careerStageExplanation: string;
  quality: number;
  ats: number;
  qualityBreakdown: ScoreBreakdown[];
  recommendations: string[];
};

export type RequirementMatch = {
  requirementId: string;
  status: MatchStatus;
  evidence: "professional experience" | "project" | "skills" | "education" | null;
  explanation: string;
  isBlocker?: boolean;
};

export type JobMatchAssessment = {
  score: number;
  alignment: "high" | "moderate" | "low";
  alignmentExplanation: string;
  recommendation: ApplyRecommendation;
  recommendationReason: string;
  matches: RequirementMatch[];
  groups: {
    strong: RequirementMatch[];
    transferable: RequirementMatch[];
    gaps: RequirementMatch[];
    blockers: RequirementMatch[];
  };
};

export const STAGE_LABEL: Record<CareerStage, string> = {
  student: "Student",
  "new-graduate": "New Graduate",
  "early-career": "Early Career Engineer",
  "mid-level": "Mid-Level Engineer",
  senior: "Senior Engineer",
  "staff-principal": "Staff / Principal+ Engineer",
  "career-changer": "Career Changer",
  "returning-professional": "Returning Professional",
};

const TOKEN = /[a-z0-9+#.]{2,}/g;
const ACTION =
  /\b(built|designed|developed|led|implemented|improved|reduced|increased|delivered|automated|launched|optimized|created|owned|scaled|migrated|architected)\b/i;
const IMPACT =
  /\b\d+(?:\.\d+)?(?:%|x|\+)?\b|\b(reduced|increased|improved|saved|grew|accelerated|doubled|tripled)\b/i;
const DATE = /^(?:[A-Z][a-z]+\s+)?\d{4}|present|current$/i;

const IMPLIED: Record<string, string[]> = {
  "next.js": ["react"],
  "spring boot": ["java"],
  "react native": ["react", "javascript"],
};

const TRANSFERABLE: Array<[string, string[]]> = [
  ["state management", ["redux", "zustand", "mobx", "recoil"]],
  ["ci cd", ["jenkins", "github actions", "azure devops", "gitlab ci", "circleci"]],
  ["message broker", ["rabbitmq", "kafka", "activemq", "sqs"]],
  ["relational database", ["postgresql", "postgres", "mysql", "mariadb", "oracle"]],
  ["nosql", ["mongodb", "dynamodb", "couchbase", "cassandra"]],
  ["cloud platform", ["aws", "gcp", "azure", "google cloud"]],
];

function normalized(value: string): string {
  return value
    .toLowerCase()
    .replace(/node\.js/g, "nodejs")
    .replace(/c\+\+/g, "cplusplus")
    .replace(/c#/g, "csharp")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

function terms(value: string): string[] {
  return normalized(value).match(TOKEN) ?? [];
}

function allEvidence(resume: Resume) {
  return [
    ...resume.experience.flatMap((item) => [
      {
        text: `${item.role} ${item.company} ${item.bullets.map((bullet) => bullet.text).join(" ")}`,
        source: "professional experience" as const,
      },
    ]),
    ...resume.projects.flatMap((item) => [
      {
        text: `${item.name} ${item.description ?? ""} ${item.technologies.map((technology) => technology.name).join(" ")} ${item.bullets.map((bullet) => bullet.text).join(" ")}`,
        source: "project" as const,
      },
    ]),
    ...resume.skills.map((group) => ({
      text: `${group.name} ${group.skills.map((skill) => skill.name).join(" ")}`,
      source: "skills" as const,
    })),
    ...resume.education.map((item) => ({
      text: `${item.degree} ${item.field ?? ""} ${item.details.map((detail) => detail.text).join(" ")}`,
      source: "education" as const,
    })),
  ];
}

function hasPhrase(text: string, phrase: string): boolean {
  return normalized(text).includes(normalized(phrase));
}

function yearIn(value: string | undefined, fallback?: number): number | undefined {
  if (!value) return fallback;
  if (/present|current/i.test(value)) return new Date().getFullYear();
  const match = value.match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : fallback;
}

export function detectCareerStageDetailed(resume: Resume): {
  stage: CareerStage;
  explanation: string;
  estimatedYears: number;
} {
  const roleText = resume.experience.map((entry) => entry.role).join(" ").toLowerCase();
  if (/principal|staff|distinguished|director|head of engineering/.test(roleText)) {
    return {
      stage: "staff-principal",
      explanation: "Detected high seniority leadership or principal architecture role titles in experience history.",
      estimatedYears: 10,
    };
  }
  if (/senior|lead|manager|architect/.test(roleText)) {
    return {
      stage: "senior",
      explanation: "Detected senior or technical lead roles in experience history.",
      estimatedYears: 7,
    };
  }

  const professionalExperience = resume.experience.filter(
    (entry) => !/\b(intern|trainee|apprentice)\b/i.test(entry.role),
  );
  const experienceStartYears = professionalExperience
    .map((entry) => yearIn(entry.startDate))
    .filter((year): year is number => year !== undefined);
  const experienceEndYears = professionalExperience
    .map((entry) => yearIn(entry.endDate))
    .filter((year): year is number => year !== undefined);
  const estimatedYears =
    experienceStartYears.length && experienceEndYears.length
      ? Math.max(0, Math.max(...experienceEndYears) - Math.min(...experienceStartYears))
      : 0;

  const educationEndYears = resume.education
    .map((entry) => yearIn(entry.endDate))
    .filter((year): year is number => year !== undefined);
  const latestEducationYear = educationEndYears.length ? Math.max(...educationEndYears) : undefined;
  const currentYear = new Date().getFullYear();
  const yearsSinceGraduation = latestEducationYear ? currentYear - latestEducationYear : undefined;

  if (professionalExperience.length === 0) {
    if (
      resume.education.some((entry) => /present|current/i.test(entry.endDate ?? "")) ||
      (latestEducationYear !== undefined && latestEducationYear >= currentYear)
    ) {
      return {
        stage: "student",
        explanation: "Currently enrolled in higher education with no full-time professional experience recorded.",
        estimatedYears: 0,
      };
    }
    if (yearsSinceGraduation !== undefined && yearsSinceGraduation > 0 && yearsSinceGraduation <= 2) {
      return {
        stage: "new-graduate",
        explanation: `Graduated within the last ${yearsSinceGraduation === 1 ? "year" : `${yearsSinceGraduation} years`} without full-time industry tenure.`,
        estimatedYears: 0,
      };
    }
    return {
      stage: "student",
      explanation: "No professional full-time employment records found; portfolio projects represent primary evidence.",
      estimatedYears: 0,
    };
  }

  if (estimatedYears >= 5 || professionalExperience.length >= 3) {
    return {
      stage: "mid-level",
      explanation: `Based on approximately ${estimatedYears >= 5 ? estimatedYears : 5} years of professional software experience.`,
      estimatedYears: Math.max(estimatedYears, 5),
    };
  }

  if (yearsSinceGraduation !== undefined && yearsSinceGraduation <= 2 && estimatedYears < 2) {
    return {
      stage: "new-graduate",
      explanation: "Recent degree completion with initial post-grad or internship experience.",
      estimatedYears,
    };
  }

  return {
    stage: "early-career",
    explanation: `Based on approximately ${Math.max(1, estimatedYears)} year(s) of professional engineering experience.`,
    estimatedYears: Math.max(1, estimatedYears),
  };
}

export function detectCareerStage(resume: Resume): CareerStage {
  return detectCareerStageDetailed(resume).stage;
}

export function getRecommendedSections(
  stage: CareerStage,
  resume?: Partial<Resume>,
): {
  recommended: RenderedSection[];
  optional: RenderedSection[];
  defaultOrder: RenderedSection[];
} {
  switch (stage) {
    case "student": {
      const hasExp = (resume?.experience?.length ?? 0) > 0;
      const recommended: RenderedSection[] = hasExp
        ? ["education", "experience", "projects", "skills"]
        : ["education", "skills", "projects"];
      const optional: RenderedSection[] = [
        ...(hasExp ? [] : (["experience"] as RenderedSection[])),
        "certifications",
        "achievements",
        "summary",
      ];
      return { recommended, optional, defaultOrder: recommended };
    }
    case "new-graduate": {
      return {
        recommended: ["experience", "education", "projects", "skills"],
        optional: ["certifications", "achievements", "summary"],
        defaultOrder: ["experience", "education", "projects", "skills"],
      };
    }
    case "early-career":
    case "mid-level": {
      return {
        recommended: ["experience", "skills", "projects", "education"],
        optional: ["summary", "certifications", "achievements"],
        defaultOrder: ["experience", "skills", "projects", "education"],
      };
    }
    case "senior":
    case "staff-principal": {
      return {
        recommended: ["summary", "experience", "skills", "education"],
        optional: ["projects", "certifications", "achievements"],
        defaultOrder: ["summary", "experience", "skills", "education"],
      };
    }
    case "career-changer": {
      return {
        recommended: ["summary", "skills", "projects", "experience", "education"],
        optional: ["certifications", "achievements"],
        defaultOrder: ["summary", "skills", "projects", "experience", "education"],
      };
    }
    case "returning-professional": {
      return {
        recommended: ["summary", "experience", "skills", "projects", "education"],
        optional: ["certifications", "achievements"],
        defaultOrder: ["summary", "experience", "skills", "projects", "education"],
      };
    }
  }
}

export function assessResume(resume: Resume, stageOverride?: CareerStage): ResumeAssessment {
  const detected = detectCareerStageDetailed(resume);
  const careerStage = stageOverride ?? detected.stage;
  const careerStageLabel = STAGE_LABEL[careerStage];
  const careerStageExplanation = stageOverride
    ? `User selected ${careerStageLabel}. Scoring and recommendations reflect this career tier.`
    : detected.explanation;

  const bullets = [
    ...resume.experience.flatMap((entry) => entry.bullets),
    ...resume.projects.flatMap((project) => project.bullets),
  ];
  const recommendations: string[] = [];

  // Content scoring adjusted by career stage
  let content = 0;
  if (careerStage === "student") {
    content = Math.min(
      25,
      (resume.education.length ? 10 : 0) +
        Math.min(10, resume.projects.length * 4) +
        Math.min(5, resume.experience.length * 5),
    );
  } else if (careerStage === "new-graduate") {
    content = Math.min(
      25,
      (resume.experience.length ? 10 : 0) +
        (resume.education.length ? 8 : 0) +
        Math.min(7, resume.projects.length * 3),
    );
  } else {
    content = Math.min(
      25,
      (resume.experience.length ? 12 : 0) +
        Math.min(8, resume.projects.length * 4) +
        Math.min(5, bullets.length),
    );
  }

  const impactBullets = bullets.filter((bullet) => IMPACT.test(bullet.text)).length;
  const actionBullets = bullets.filter((bullet) => ACTION.test(bullet.text)).length;
  const impact = Math.min(20, impactBullets * 4 + Math.min(8, actionBullets * 2));

  const totalSkills = resume.skills.flatMap((group) => group.skills).length;
  const projectTechs = resume.projects.flatMap((project) => project.technologies).length;
  const technical = Math.min(15, Math.min(10, totalSkills) + Math.min(5, projectTechs));

  const structure = Math.min(
    15,
    (resume.basics.name ? 4 : 0) +
      (resume.experience.length || careerStage === "student" ? 4 : 0) +
      (resume.skills.length ? 3 : 0) +
      (resume.education.length ? 2 : 0) +
      (resume.projects.length ? 2 : 0),
  );

  const readable = bullets.filter((bullet) => bullet.text.length <= 220).length;
  const readability = bullets.length ? Math.round((readable / bullets.length) * 10) : 4;

  const dated = resume.experience.filter(
    (item) => DATE.test(item.startDate) && DATE.test(item.endDate),
  ).length;
  const consistency = Math.min(
    10,
    (resume.basics.email || resume.basics.phone ? 3 : 0) +
      (resume.experience.length ? Math.round((dated / resume.experience.length) * 7) : 5),
  );

  if (impactBullets < Math.ceil(Math.max(bullets.length, 1) / 2)) {
    recommendations.push(
      "Add factual outcomes or scale (latency, users, throughput) to bullets that currently describe duties only.",
    );
  }
  if (bullets.some((bullet) => bullet.text.length > 220)) {
    recommendations.push("Shorten the longest bullets so key technical results are easily scannable in 10 seconds.");
  }
  if (!resume.basics.email && !resume.basics.phone) {
    recommendations.push("Add an email address or phone number so recruiters have direct contact information.");
  }
  if (totalSkills < 5) {
    recommendations.push("Add the technologies you have actually used, grouped under clear skill categories.");
  }

  const qualityBreakdown: ScoreBreakdown[] = [
    { label: "Content", score: content, max: 25 },
    { label: "Impact", score: impact, max: 20 },
    { label: "Structure", score: structure, max: 15 },
    { label: "Technical signal", score: technical, max: 15 },
    { label: "Readability", score: readability, max: 10 },
    { label: "Consistency", score: consistency, max: 10 },
  ];
  const quality = qualityBreakdown.reduce((total, item) => total + item.score, 0);

  const ats = Math.min(
    100,
    75 +
      (resume.basics.email || resume.basics.phone ? 8 : 0) +
      (resume.experience.length ? 5 : 0) +
      (resume.skills.length ? 4 : 0) +
      (resume.education.length ? 3 : 0) +
      (bullets.every((bullet) => bullet.text.length <= 300) ? 5 : 0),
  );

  return {
    careerStage,
    careerStageLabel,
    careerStageExplanation,
    quality,
    ats,
    qualityBreakdown,
    recommendations,
  };
}

function matchRequirement(requirement: JobRequirement, resume: Resume): RequirementMatch {
  const evidence = allEvidence(resume);
  const requirementText = normalized(requirement.text);

  // Check for hard blocker requirements (e.g., explicit citizenship, clearance, YoE)
  const isBlocker = requirement.tier === "blocker";

  const exact = evidence.find((item) => hasPhrase(item.text, requirementText));
  if (exact) {
    return {
      requirementId: requirement.id,
      status: "exact",
      evidence: exact.source,
      explanation: `Directly represented in ${exact.source}.`,
      isBlocker,
    };
  }

  const requirementTerms = terms(requirement.text).filter((term) => term.length > 2);
  for (const [from, implied] of Object.entries(IMPLIED)) {
    if (
      implied.some((item) => normalized(item) === requirementText) &&
      evidence.some((entry) => hasPhrase(entry.text, from))
    ) {
      const matched = evidence.find((entry) => hasPhrase(entry.text, from))!;
      return {
        requirementId: requirement.id,
        status: "transferable",
        evidence: matched.source,
        explanation: `Related evidence (${from}) supports ${requirement.text}, but it is not claimed as an exact technology match.`,
        isBlocker,
      };
    }
    if (
      requirementText === from &&
      implied.some((item) => evidence.some((entry) => hasPhrase(entry.text, item)))
    ) {
      const matched = evidence.find((entry) => implied.some((item) => hasPhrase(entry.text, item)))!;
      return {
        requirementId: requirement.id,
        status: "transferable",
        evidence: matched.source,
        explanation: `Related evidence supports ${from}, but it is not claimed as an exact technology match.`,
        isBlocker,
      };
    }
  }

  for (const [concept, technologies] of TRANSFERABLE) {
    if (
      requirementText.includes(concept) &&
      technologies.some((technology) => evidence.some((entry) => hasPhrase(entry.text, technology)))
    ) {
      const matched = evidence.find((entry) =>
        technologies.some((technology) => hasPhrase(entry.text, technology)),
      )!;
      return {
        requirementId: requirement.id,
        status: "transferable",
        evidence: matched.source,
        explanation: `Related ${concept} experience is represented; no product substitution is assumed.`,
        isBlocker,
      };
    }
  }

  const overlap = evidence
    .map((item) => ({
      ...item,
      overlap: requirementTerms.filter((term) => terms(item.text).includes(term)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)[0];

  if (overlap && requirementTerms.length > 0 && overlap.overlap >= Math.min(2, requirementTerms.length)) {
    return {
      requirementId: requirement.id,
      status: "partial",
      evidence: overlap.source,
      explanation: `Partially represented in ${overlap.source}; the requirement should be reviewed for precise fit.`,
      isBlocker,
    };
  }

  return {
    requirementId: requirement.id,
    status: isBlocker ? "blocker" : "not-represented",
    evidence: null,
    explanation: isBlocker
      ? "This requirement appears mandatory/blocking and is not represented in the current resume."
      : "This requirement is not represented in the current resume. That does not establish a candidate knowledge gap.",
    isBlocker,
  };
}

export function assessJobMatch(
  resume: Resume,
  analysis: JobAnalysis,
): JobMatchAssessment {
  const matches = analysis.requirements.map((requirement) => matchRequirement(requirement, resume));

  let totalWeight = 0;
  let earnedWeight = 0;
  let blockerCount = 0;

  for (let i = 0; i < analysis.requirements.length; i++) {
    const req = analysis.requirements[i];
    const match = matches[i];

    const isBlocker = req.tier === "blocker" || match.status === "blocker";
    if (isBlocker && match.status === "blocker") {
      blockerCount++;
    }

    const weight =
      req.importance === "required" ? 5 : req.importance === "preferred" ? 3 : 1;
    totalWeight += weight;

    const multiplier =
      match.status === "exact"
        ? 1.0
        : match.status === "transferable"
          ? 0.75
          : match.status === "partial"
            ? 0.45
            : 0;

    earnedWeight += weight * multiplier;
  }

  // Base raw score (0–100)
  let rawScore = totalWeight ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Apply blocker penalty if blockers detected
  if (blockerCount > 0) {
    rawScore = Math.max(0, rawScore - blockerCount * 15);
  }

  const score = rawScore;

  // Apply Recommendation
  let recommendation: ApplyRecommendation = "Low Match";
  let recommendationReason = "";

  if (blockerCount > 0) {
    recommendation = "Likely Blocked";
    recommendationReason = `${blockerCount} mandatory requirement(s) or blocker signals are not represented in your resume.`;
  } else if (score >= 80) {
    recommendation = "Strong Apply";
    recommendationReason =
      "Your verified experience strongly covers the core technical requirements and responsibilities.";
  } else if (score >= 65) {
    recommendation = "Apply";
    recommendationReason =
      "Your experience covers the primary technical expectations. Missing technologies appear to be secondary or preferred.";
  } else if (score >= 48) {
    recommendation = "Stretch Apply";
    recommendationReason =
      "Meaningful transferable skills exist, but several key qualifications are not represented.";
  } else {
    recommendation = "Low Match";
    recommendationReason =
      "Core qualifications for this role are largely unrepresented in your current resume evidence.";
  }

  // Screening Alignment
  const alignment: "high" | "moderate" | "low" =
    blockerCount > 0 || score < 45 ? "low" : score >= 72 ? "high" : "moderate";

  const alignmentExplanation =
    alignment === "high"
      ? "Strong alignment with requirements likely to be checked during initial recruiter and automated screening."
      : alignment === "moderate"
        ? "Satisfies majority of screening criteria with a few preferred qualifications unrepresented."
        : "Low screening alignment. Key mandatory qualifications or experience duration are unrepresented.";

  const groups = {
    strong: matches.filter((m) => m.status === "exact"),
    transferable: matches.filter((m) => m.status === "transferable" || m.status === "partial"),
    gaps: matches.filter((m) => m.status === "not-represented"),
    blockers: matches.filter((m) => m.status === "blocker" || (m.isBlocker && m.status !== "exact")),
  };

  return {
    score,
    alignment,
    alignmentExplanation,
    recommendation,
    recommendationReason,
    matches,
    groups,
  };
}
