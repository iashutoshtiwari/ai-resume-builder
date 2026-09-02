import { createId } from "@/lib/utils";

/**
 * Extract and parse JSON from raw LLM output, handling markdown fences,
 * conversational preambles, reasoning tags (<think>...</think>), and trailing text.
 */
export function extractAndParseJson(raw: string): unknown {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new SyntaxError("Empty AI response content.");
  }

  let text = raw.trim();

  // 1. Remove reasoning/think tags
  text = text.replace(/<(?:thought|think|reasoning)>[\s\S]*?<\/(?:thought|think|reasoning)>/gi, "").trim();

  // 2. Try direct JSON parse first
  try {
    return JSON.parse(text);
  } catch {
    // Continue to extractors
  }

  // 3. Match code blocks ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match[1]?.trim()) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // Continue to next code block if any
      }
    }
  }

  // 4. Find outermost balanced JSON object { ... } or array [ ... ]
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const startIdx =
    firstBrace !== -1 && firstBracket !== -1
      ? Math.min(firstBrace, firstBracket)
      : firstBrace !== -1
      ? firstBrace
      : firstBracket;

  if (startIdx !== -1) {
    const isObject = text[startIdx] === "{";
    const lastIdx = isObject ? text.lastIndexOf("}") : text.lastIndexOf("]");
    if (lastIdx !== -1 && lastIdx > startIdx) {
      const candidate = text.slice(startIdx, lastIdx + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        try {
          const relaxed = candidate.replace(/,\s*([}\]])/g, "$1");
          return JSON.parse(relaxed);
        } catch {
          // Fall through
        }
      }
    }
  }

  throw new SyntaxError(`Could not extract valid JSON from model response: "${text.slice(0, 100)}"`);
}

export function normalizeRawJobAnalysis(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const obj = raw as Record<string, unknown>;

  const rawAnalysis = obj.analysis ?? (obj.requirements ? obj : {});
  const analysisObj = (typeof rawAnalysis === "object" && rawAnalysis !== null ? rawAnalysis : {}) as Record<string, unknown>;

  const rawComp = obj.comparison ?? (Array.isArray(obj.entries) ? { entries: obj.entries } : { entries: [] });
  const comparisonObj = (typeof rawComp === "object" && rawComp !== null ? rawComp : {}) as Record<string, unknown>;

  const rawReqs = Array.isArray(analysisObj.requirements) ? analysisObj.requirements : [];
  const reqSeen = new Set<string>();

  const requirements = rawReqs.map((req: unknown, index: number) => {
    const reqObj = typeof req === "object" && req !== null ? (req as Record<string, unknown>) : null;
    let id = reqObj && reqObj.id ? String(reqObj.id) : `req-${index + 1}`;
    if (reqSeen.has(id)) id = `req-${index + 1}-${Math.random().toString(36).slice(2, 6)}`;
    reqSeen.add(id);

    const validCategory = ["skill", "technology", "experience", "responsibility", "domain", "education", "soft-skill", "other"];
    const category = reqObj && typeof reqObj.category === "string" && validCategory.includes(reqObj.category) ? reqObj.category : "skill";
    const validImportance = ["required", "preferred", "inferred"];
    const importance = reqObj && typeof reqObj.importance === "string" && validImportance.includes(reqObj.importance) ? reqObj.importance : "required";
    const text = typeof req === "string" ? req : reqObj ? String(reqObj.text || reqObj.requirement || reqObj.name || "Requirement") : "Requirement";

    return { id, text: text.slice(0, 600), category, importance };
  });

  const rawEntries = Array.isArray(comparisonObj.entries)
    ? comparisonObj.entries
    : Array.isArray(comparisonObj)
    ? (comparisonObj as unknown[])
    : [];

  const entryMap = new Map<string, Record<string, unknown>>();
  for (const entry of rawEntries) {
    if (typeof entry === "object" && entry !== null) {
      const entryObj = entry as Record<string, unknown>;
      if (entryObj.requirementId) {
        entryMap.set(String(entryObj.requirementId), entryObj);
      }
    }
  }

  const entries = requirements.map((req: { id: string; text: string }) => {
    const existing = entryMap.get(req.id);
    const validStatus = ["supported", "under-emphasized", "unsupported"];
    const status = existing && typeof existing.status === "string" && validStatus.includes(existing.status) ? existing.status : "under-emphasized";
    const explanation = existing && existing.explanation ? String(existing.explanation).slice(0, 800) : `Evaluated against resume requirements for ${req.text}`;
    const evidence = existing && Array.isArray(existing.evidence) ? existing.evidence : [];

    return {
      requirementId: req.id,
      status,
      explanation,
      evidence: status === "unsupported" ? [] : evidence,
    };
  });

  return {
    analysis: {
      company: analysisObj.company ? String(analysisObj.company).slice(0, 200) : undefined,
      role: analysisObj.role ? String(analysisObj.role).slice(0, 200) : undefined,
      summary: String(analysisObj.summary || "Target job role analysis").slice(0, 1200),
      requirements,
      keywords: Array.isArray(analysisObj.keywords) ? analysisObj.keywords.map(String) : [],
      primaryResponsibilities: Array.isArray(analysisObj.primaryResponsibilities) ? analysisObj.primaryResponsibilities.map(String) : [],
      senioritySignals: Array.isArray(analysisObj.senioritySignals) ? analysisObj.senioritySignals.map(String) : [],
      domainSignals: Array.isArray(analysisObj.domainSignals) ? analysisObj.domainSignals.map(String) : [],
    },
    comparison: { entries },
  };
}

export function normalizeRawResume(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;

  const obj = raw as Record<string, unknown>;
  
  // Unwrap nested structures if present
  const dataObj = typeof obj.data === "object" && obj.data !== null ? (obj.data as Record<string, unknown>) : null;
  const resultObj = typeof obj.result === "object" && obj.result !== null ? (obj.result as Record<string, unknown>) : null;
  const unwrapCandidate = obj.resume ?? (obj.basics ? obj : dataObj?.resume ?? resultObj?.resume ?? obj.data ?? obj);
  
  const resumeObj = (typeof unwrapCandidate === "object" && unwrapCandidate !== null ? unwrapCandidate : {}) as Record<string, unknown>;

  const seenIds = new Set<string>();
  const getUniqueId = (prefix: string, existingId?: unknown): string => {
    let id = typeof existingId === "string" && existingId.trim() ? existingId.trim() : "";
    if (!id || seenIds.has(id)) {
      id = createId(prefix);
    }
    seenIds.add(id);
    return id;
  };

  // 1. Basics
  const rawBasics = (typeof resumeObj.basics === "object" && resumeObj.basics !== null ? resumeObj.basics : {}) as Record<string, unknown>;
  const links = Array.isArray(rawBasics.links)
    ? rawBasics.links.map((link: unknown) => {
        if (typeof link === "string") {
          return {
            id: getUniqueId("link"),
            label: link.replace(/^https?:\/\//, "").split("/")[0] || "Link",
            url: link.startsWith("http") ? link : `https://${link}`,
          };
        }
        if (typeof link === "object" && link !== null) {
          const linkObj = link as Record<string, unknown>;
          const url = String(linkObj.url || linkObj.href || linkObj.link || "");
          const label = String(linkObj.label || linkObj.name || linkObj.title || url || "Link");
          return {
            id: getUniqueId("link", linkObj.id),
            label: label.slice(0, 160),
            url: (url.startsWith("http") ? url : `https://${url || "example.com"}`).slice(0, 2048),
          };
        }
        return null;
      }).filter((item): item is { id: string; label: string; url: string } => item !== null)
    : [];

  const basics = {
    name: String(rawBasics.name || rawBasics.fullName || resumeObj.name || "Candidate").slice(0, 160),
    headline: rawBasics.headline || rawBasics.title || rawBasics.summary ? String(rawBasics.headline || rawBasics.title || rawBasics.summary).slice(0, 240) : undefined,
    email: rawBasics.email ? String(rawBasics.email).slice(0, 254) : undefined,
    phone: rawBasics.phone ? String(rawBasics.phone).slice(0, 80) : undefined,
    location: rawBasics.location ? String(rawBasics.location).slice(0, 160) : undefined,
    links,
  };

  // 2. Skills
  let skills: Array<{ id: string; name: string; skills: Array<{ id: string; name: string }> }> = [];
  const rawSkills = resumeObj.skills ?? resumeObj.skillGroups ?? [];
  if (Array.isArray(rawSkills)) {
    if (rawSkills.length > 0 && typeof rawSkills[0] === "string") {
      skills = [
        {
          id: getUniqueId("skill-group"),
          name: "Technical Skills",
          skills: rawSkills.map((s: unknown) => ({
            id: getUniqueId("skill"),
            name: String(s).slice(0, 160),
          })),
        },
      ];
    } else {
      skills = rawSkills.map((group: unknown) => {
        if (typeof group === "string") {
          return {
            id: getUniqueId("skill-group"),
            name: group.slice(0, 120),
            skills: [],
          };
        }
        const groupObj = typeof group === "object" && group !== null ? (group as Record<string, unknown>) : {};
        const rawGroupSkills = Array.isArray(groupObj.skills) ? groupObj.skills : [];
        const groupSkills = rawGroupSkills.map((item: unknown) => {
          if (typeof item === "string") {
            return { id: getUniqueId("skill"), name: item.slice(0, 160) };
          }
          if (typeof item === "object" && item !== null) {
            const itemObj = item as Record<string, unknown>;
            return {
              id: getUniqueId("skill", itemObj.id),
              name: String(itemObj.name || itemObj.text || itemObj.skill || "").slice(0, 160),
            };
          }
          return null;
        }).filter((item): item is { id: string; name: string } => item !== null);

        return {
          id: getUniqueId("skill-group", groupObj.id),
          name: String(groupObj.name || groupObj.category || "General").slice(0, 120),
          skills: groupSkills,
        };
      });
    }
  }

  // 3. Experience
  const rawExp = resumeObj.experience ?? resumeObj.workExperience ?? resumeObj.work ?? [];
  const experience = Array.isArray(rawExp)
    ? rawExp.map((exp: unknown) => {
        const expObj = typeof exp === "object" && exp !== null ? (exp as Record<string, unknown>) : {};
        const rawBullets = Array.isArray(expObj.bullets) ? expObj.bullets : [];
        const bullets = rawBullets.map((b: unknown) => {
          if (typeof b === "string") {
            return { id: getUniqueId("bullet"), text: b.slice(0, 2000) };
          }
          if (typeof b === "object" && b !== null) {
            const bObj = b as Record<string, unknown>;
            return {
              id: getUniqueId("bullet", bObj.id),
              text: String(bObj.text || bObj.description || bObj.content || "").slice(0, 2000),
            };
          }
          return null;
        }).filter((item): item is { id: string; text: string } => item !== null && item.text.trim().length > 0);

        return {
          id: getUniqueId("exp", expObj.id),
          company: String(expObj.company || expObj.employer || expObj.organization || "Company").slice(0, 200),
          role: String(expObj.role || expObj.title || expObj.position || "Role").slice(0, 200),
          location: expObj.location ? String(expObj.location).slice(0, 160) : undefined,
          startDate: String(expObj.startDate || expObj.start || expObj.from || "").slice(0, 80),
          endDate: String(expObj.endDate || expObj.end || expObj.to || "").slice(0, 80),
          bullets,
        };
      })
    : [];

  // 4. Projects
  const rawProjects = resumeObj.projects ?? [];
  const projects = Array.isArray(rawProjects)
    ? rawProjects.map((proj: unknown) => {
        const projObj = typeof proj === "object" && proj !== null ? (proj as Record<string, unknown>) : {};
        const rawTech = Array.isArray(projObj.technologies) ? projObj.technologies : [];
        const technologies = rawTech.map((t: unknown) => {
          if (typeof t === "string") {
            return { id: getUniqueId("tech"), name: t.slice(0, 160) };
          }
          if (typeof t === "object" && t !== null) {
            const tObj = t as Record<string, unknown>;
            return {
              id: getUniqueId("tech", tObj.id),
              name: String(tObj.name || tObj.tech || "").slice(0, 160),
            };
          }
          return null;
        }).filter((item): item is { id: string; name: string } => item !== null && item.name.trim().length > 0);

        const rawBullets = Array.isArray(projObj.bullets) ? projObj.bullets : [];
        const bullets = rawBullets.map((b: unknown) => {
          if (typeof b === "string") {
            return { id: getUniqueId("bullet"), text: b.slice(0, 2000) };
          }
          if (typeof b === "object" && b !== null) {
            const bObj = b as Record<string, unknown>;
            return {
              id: getUniqueId("bullet", bObj.id),
              text: String(bObj.text || bObj.description || "").slice(0, 2000),
            };
          }
          return null;
        }).filter((item): item is { id: string; text: string } => item !== null && item.text.trim().length > 0);

        const rawLinks = Array.isArray(projObj.links) ? projObj.links : [];
        const projLinks = rawLinks.map((link: unknown) => {
          if (typeof link === "string") {
            return {
              id: getUniqueId("link"),
              label: "Project Link",
              url: link.startsWith("http") ? link : `https://${link}`,
            };
          }
          if (typeof link === "object" && link !== null) {
            const linkObj = link as Record<string, unknown>;
            const url = String(linkObj.url || linkObj.href || linkObj.link || "");
            return {
              id: getUniqueId("link", linkObj.id),
              label: String(linkObj.label || linkObj.name || "Project Link").slice(0, 160),
              url: (url.startsWith("http") ? url : `https://${url || "example.com"}`).slice(0, 2048),
            };
          }
          return null;
        }).filter((item): item is { id: string; label: string; url: string } => item !== null);

        return {
          id: getUniqueId("proj", projObj.id),
          name: String(projObj.name || projObj.title || "Project").slice(0, 200),
          description: projObj.description ? String(projObj.description).slice(0, 500) : undefined,
          technologies,
          links: projLinks,
          bullets,
        };
      })
    : [];

  // 5. Education
  const rawEdu = resumeObj.education ?? [];
  const education = Array.isArray(rawEdu)
    ? rawEdu.map((edu: unknown) => {
        const eduObj = typeof edu === "object" && edu !== null ? (edu as Record<string, unknown>) : {};
        const rawDetails = Array.isArray(eduObj.details) ? eduObj.details : [];
        const details = rawDetails.map((d: unknown) => {
          if (typeof d === "string") {
            return { id: getUniqueId("detail"), text: d.slice(0, 2000) };
          }
          if (typeof d === "object" && d !== null) {
            const dObj = d as Record<string, unknown>;
            return {
              id: getUniqueId("detail", dObj.id),
              text: String(dObj.text || dObj.detail || "").slice(0, 2000),
            };
          }
          return null;
        }).filter((item): item is { id: string; text: string } => item !== null);

        return {
          id: getUniqueId("edu", eduObj.id),
          institution: String(eduObj.institution || eduObj.school || eduObj.university || "Institution").slice(0, 200),
          degree: String(eduObj.degree || "Degree").slice(0, 200),
          field: eduObj.field || eduObj.major ? String(eduObj.field || eduObj.major).slice(0, 200) : undefined,
          location: eduObj.location ? String(eduObj.location).slice(0, 160) : undefined,
          startDate: eduObj.startDate ? String(eduObj.startDate).slice(0, 80) : undefined,
          endDate: eduObj.endDate ? String(eduObj.endDate).slice(0, 80) : undefined,
          details,
        };
      })
    : [];

  const warnings = Array.isArray(obj.warnings)
    ? obj.warnings.map((w: unknown) => {
        const wObj = typeof w === "object" && w !== null ? (w as Record<string, unknown>) : null;
        return {
          code: String(wObj?.code || "PARSE_NOTE").slice(0, 50),
          message: String(wObj?.message || w || "").slice(0, 1000),
        };
      })
    : [];

  return {
    resume: {
      version: 1 as const,
      basics,
      skills,
      experience,
      projects,
      education,
    },
    warnings,
  };
}
