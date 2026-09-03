import { GLOBAL_KNOWLEDGE } from "@/features/guidance/knowledge/global";
import { CAREER_STAGE_KNOWLEDGE } from "@/features/guidance/knowledge/career-stage";
import { LOCALE_KNOWLEDGE } from "@/features/guidance/knowledge/locale";
import { SECTIONS_KNOWLEDGE } from "@/features/guidance/knowledge/sections";
import type { GuidanceChunk } from "@/features/guidance/schema";

export const RESUME_KNOWLEDGE_BASE: GuidanceChunk[] = [
  ...GLOBAL_KNOWLEDGE,
  ...CAREER_STAGE_KNOWLEDGE,
  ...LOCALE_KNOWLEDGE,
  ...SECTIONS_KNOWLEDGE,
];

export {
  GLOBAL_KNOWLEDGE,
  CAREER_STAGE_KNOWLEDGE,
  LOCALE_KNOWLEDGE,
  SECTIONS_KNOWLEDGE,
};
