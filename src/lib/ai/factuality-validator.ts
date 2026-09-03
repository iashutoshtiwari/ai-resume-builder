import type { CandidateProfile } from "@/features/resume/candidate-profile";
import type { Resume } from "@/features/resume/schema";

export type FactualityViolation = {
  code:
    | "unsupported-technology"
    | "invented-metric"
    | "modified-date"
    | "modified-employer"
    | "unsupported-certification";
  message: string;
  field?: string;
};

export type FactualityValidationResult = {
  valid: boolean;
  violations: FactualityViolation[];
};

const IMPLIED_SKILLS: Record<string, string[]> = {
  "next.js": ["react"],
  "spring boot": ["java"],
  "react native": ["react", "javascript"],
  typescript: ["javascript"],
};

const CONCEPTUAL_EQUIVALENCE: Record<string, string[]> = {
  "state management": ["redux", "zustand", "mobx", "recoil"],
  "ci/cd": ["jenkins", "github actions", "azure devops", "gitlab ci", "circleci"],
  "message broker": ["rabbitmq", "kafka", "activemq", "sqs"],
  "relational database": ["postgresql", "postgres", "mysql", "mariadb", "oracle"],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/node\.js/g, "nodejs")
    .replace(/c\+\+/g, "cplusplus")
    .replace(/c#/g, "csharp")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

function extractNumericClaims(text: string): string[] {
  return text.match(/(?:\$?\d+(?:\.\d+)?(?:%|x|k|m|b|k|million|billion|users?|\+)|\b\d{2,}\b)/gi) ?? [];
}

export function buildCandidateEvidenceCorpus(profileOrResume: CandidateProfile | Resume): {
  text: string;
  technologies: Set<string>;
  employers: Set<string>;
  dates: Set<string>;
  metrics: Set<string>;
} {
  const isProfile = "personal" in profileOrResume;
  const experience = isProfile ? profileOrResume.experience : profileOrResume.experience;
  const projects = isProfile ? profileOrResume.projects : profileOrResume.projects;
  const skills = isProfile ? profileOrResume.skills : profileOrResume.skills;
  const education = isProfile ? profileOrResume.education : profileOrResume.education;

  const corpusText = [
    ...experience.flatMap((e) => [e.company, e.role, ...e.bullets.map((b) => b.text)]),
    ...projects.flatMap((p) => [
      p.name,
      p.description ?? "",
      ...p.technologies.map((t) => t.name),
      ...p.bullets.map((b) => b.text),
    ]),
    ...skills.flatMap((g) => [g.name, ...g.skills.map((s) => s.name)]),
    ...education.flatMap((ed) => [ed.institution, ed.degree, ed.field ?? "", ...ed.details.map((d) => d.text)]),
  ].join(" ");

  const normalizedCorpus = normalize(corpusText);

  const technologies = new Set<string>();
  for (const group of skills) {
    for (const skill of group.skills) {
      technologies.add(normalize(skill.name));
    }
  }
  for (const project of projects) {
    for (const tech of project.technologies) {
      technologies.add(normalize(tech.name));
    }
  }

  // Expand with logically implied skills
  for (const tech of Array.from(technologies)) {
    const implied = IMPLIED_SKILLS[tech];
    if (implied) {
      for (const imp of implied) {
        technologies.add(normalize(imp));
      }
    }
  }

  const employers = new Set(experience.map((e) => normalize(e.company)));
  const dates = new Set(experience.flatMap((e) => [normalize(e.startDate), normalize(e.endDate)]));
  const metrics = new Set(extractNumericClaims(corpusText).map(normalize));

  return {
    text: normalizedCorpus,
    technologies,
    employers,
    dates,
    metrics,
  };
}

export function validateResumeAgainstEvidence(
  proposedResume: Resume,
  evidenceSource: CandidateProfile | Resume,
): FactualityValidationResult {
  const evidence = buildCandidateEvidenceCorpus(evidenceSource);
  const violations: FactualityViolation[] = [];

  // 1. Verify experience employers and dates
  for (const exp of proposedResume.experience) {
    const normalizedCompany = normalize(exp.company);
    if (!evidence.employers.has(normalizedCompany) && !evidence.text.includes(normalizedCompany)) {
      violations.push({
        code: "modified-employer",
        message: `Employer "${exp.company}" does not match candidate history.`,
        field: `experience.${exp.id}.company`,
      });
    }

    // Check dates
    if (exp.startDate && !evidence.dates.has(normalize(exp.startDate)) && !evidence.text.includes(normalize(exp.startDate))) {
      violations.push({
        code: "modified-date",
        message: `Start date "${exp.startDate}" for ${exp.company} was modified or added without evidence.`,
        field: `experience.${exp.id}.startDate`,
      });
    }
  }

  // 2. Check for invented metrics in bullets
  const allProposedBullets = [
    ...proposedResume.experience.flatMap((e) => e.bullets),
    ...proposedResume.projects.flatMap((p) => p.bullets),
  ];

  for (const bullet of allProposedBullets) {
    const claims = extractNumericClaims(bullet.text);
    for (const claim of claims) {
      const normClaim = normalize(claim);
      // Allow single-digit counts like "2 teams" or "3 microservices" or dates, but reject specific metrics
      if (
        !evidence.metrics.has(normClaim) &&
        !evidence.text.includes(normClaim) &&
        !/^(1|2|3|4|5|10|202\d|201\d|199\d)$/.test(normClaim)
      ) {
        violations.push({
          code: "invented-metric",
          message: `The metric "${claim}" in bullet "${bullet.text.slice(0, 60)}..." is not grounded in candidate evidence.`,
          field: bullet.id,
        });
      }
    }
  }

  // 3. Verify newly added skills
  for (const group of proposedResume.skills) {
    for (const skill of group.skills) {
      const normSkill = normalize(skill.name);
      const isKnown =
        evidence.technologies.has(normSkill) ||
        evidence.text.includes(normSkill);

      if (!isKnown) {
        // Check if it's conceptually equivalent
        let equivalentFound = false;
        for (const [concept, members] of Object.entries(CONCEPTUAL_EQUIVALENCE)) {
          if (normSkill.includes(concept) && members.some((m) => evidence.technologies.has(m) || evidence.text.includes(m))) {
            equivalentFound = true;
            break;
          }
        }

        if (!equivalentFound) {
          violations.push({
            code: "unsupported-technology",
            message: `Technology "${skill.name}" has no supporting evidence in the candidate profile.`,
            field: `skills.${group.id}.${skill.id}`,
          });
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
