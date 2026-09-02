import type { GuidanceFinding } from "@/features/guidance/schema";
import type { ResumePresentation } from "@/features/presentation/schema";
import type { Resume } from "@/features/resume/schema";

const PRONOUNS = /\b(?:i|we|us|my|our|ours)\b/i;
const WEAK_VERB = /^(?:(?:i|we|us|my|our|ours)\s+)?(?:aided|assisted|coded|collaborated|communicated|executed|helped|participated|programmed|ran|used|utilized|worked on|gained experience)\b/i;
const MONTH = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;
const NUMERIC_MONTH = /\b(?:0?[1-9]|1[0-2])[/-](?:19|20)\d{2}\b/;

type AuditInput = {
  resume: Resume;
  presentation: ResumePresentation;
  manualLatex: boolean;
  pageCount: number | null;
  compiledCurrent: boolean;
};

function finding(ruleId: string, severity: GuidanceFinding["severity"], title: string, message: string, target?: string): GuidanceFinding {
  return { id: `finding-${ruleId}${target ? `-${target}` : ""}`, ruleId, severity, title, message, ...(target ? { target } : {}) };
}

export function auditResumeGuidance(input: AuditInput): GuidanceFinding[] {
  const bullets = [
    ...input.resume.experience.flatMap((entry) => entry.bullets.map((bullet) => ({ ...bullet, target: `${entry.role}: ${bullet.id}` }))),
    ...input.resume.projects.flatMap((entry) => entry.bullets.map((bullet) => ({ ...bullet, target: `${entry.name}: ${bullet.id}` }))),
  ];
  const findings: GuidanceFinding[] = [];
  const periodBullets = bullets.filter((bullet) => /[.!?]$/.test(bullet.text.trim()));
  findings.push(periodBullets.length
    ? finding("er-no-periods", "action", "Make bullet endings consistent", `${periodBullets.length} bullet${periodBullets.length === 1 ? " ends" : "s end"} with punctuation; this guide recommends no terminal periods.`)
    : finding("er-no-periods", "passed", "Bullet endings are consistent", "No resume bullet ends with terminal punctuation."));

  const pronounBullets = bullets.filter((bullet) => PRONOUNS.test(bullet.text));
  findings.push(pronounBullets.length
    ? finding("er-no-pronouns", "action", "Remove personal pronouns", `${pronounBullets.length} bullet${pronounBullets.length === 1 ? " contains" : "s contain"} a first-person pronoun.`)
    : finding("er-no-pronouns", "passed", "No personal pronouns found", "Bullets use direct resume phrasing."));

  const weakBullets = bullets.filter((bullet) => WEAK_VERB.test(bullet.text.trim()));
  findings.push(weakBullets.length
    ? finding("er-weak-verbs", "action", "Strengthen opening verbs", `${weakBullets.length} bullet${weakBullets.length === 1 ? " starts" : "s start"} with a weak or vague verb.`)
    : finding("er-action-verbs", "passed", "Opening verbs look specific", "No known weak opening verbs were detected."));

  const longBullets = bullets.filter((bullet) => bullet.text.trim().split(/\s+/).length > 35);
  findings.push(longBullets.length
    ? finding("er-bullet-one-sentence", "review", "Review long bullets", `${longBullets.length} bullet${longBullets.length === 1 ? " exceeds" : "s exceed"} 35 words and may render beyond two lines.`)
    : finding("er-bullet-one-sentence", "passed", "Bullet length is scannable", "All bullets are 35 words or fewer."));

  const dates = [...input.resume.experience.flatMap((entry) => [entry.startDate, entry.endDate]), ...input.resume.education.flatMap((entry) => [entry.startDate, entry.endDate])].filter((value): value is string => Boolean(value));
  const mixesDateStyles = dates.some((date) => MONTH.test(date)) && dates.some((date) => NUMERIC_MONTH.test(date));
  findings.push(mixesDateStyles
    ? finding("er-date-format", "review", "Standardize date formats", "Written and numeric month formats are mixed across entries.")
    : finding("er-date-format", "passed", "Date style is consistent", "No mixed written and numeric month formats were detected."));

  findings.push(input.manualLatex
    ? finding("er-single-column", "review", "Manual source is unverified", "The ATS-safe format audit cannot guarantee the structure of a manual LaTeX override.")
    : finding("er-single-column", "passed", "Canonical single-column structure", "Generated source uses the supported single-column renderer."));

  const safeFormat = input.presentation.margin >= 0.4 && input.presentation.fontSize >= 10.5;
  findings.push(safeFormat
    ? finding("er-readable-type", "passed", "Typography stays inside guardrails", `Text is ${input.presentation.fontSize}pt with ${input.presentation.margin}-inch margins.`)
    : finding("er-readable-type", "action", "Restore readable formatting", "Use at least 10.5pt type and 0.4-inch margins."));

  if (!input.compiledCurrent || input.pageCount === null) {
    findings.push(finding("er-page-length", "review", "Compile to verify page length", "Page-length guidance requires a current successful PDF compile."));
  } else if (input.pageCount > 1) {
    findings.push(finding("er-page-length", "review", "Resume spans multiple pages", `${input.pageCount} pages may be justified for roughly 10+ years of relevant experience or senior scope; otherwise remove less relevant material.`));
  } else {
    findings.push(finding("er-page-length", "passed", "Resume fits one page", "The current compiled PDF is one page."));
  }

  const sections = input.presentation.sections;
  const sectionOrderLooksRelevant = input.resume.experience.length > 0
    ? sections[0] === "experience" || sections[0] === "skills"
    : sections[0] === "education" || sections[0] === "projects";
  findings.push(sectionOrderLooksRelevant
    ? finding("er-section-order-experienced", "passed", "Section order supports quick scanning", "The first section matches the candidate's available evidence.")
    : finding("er-section-order-experienced", "review", "Review section order", "Lead with Experience or Skills when professional evidence is strongest; students may lead with Education or Projects."));

  return findings;
}
