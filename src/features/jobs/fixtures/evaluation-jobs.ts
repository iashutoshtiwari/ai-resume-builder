import type { JobAnalysis } from "@/features/jobs/schema";

/**
 * Section 77: Critical Test Case Job Requirements
 * Requires: Kubernetes, Go, AWS, Docker, Microservices, CI/CD, Kafka, Redis.
 */
export const criticalTestCaseJob: JobAnalysis = {
  company: "ScaleCloud Systems",
  role: "Senior Cloud Infrastructure Engineer",
  summary:
    "Looking for an engineer with deep expertise in Kubernetes, Go, and AWS to scale distributed microservices pipelines using Kafka, Redis, and automated CI/CD.",
  keywords: [
    "Kubernetes",
    "Go",
    "AWS",
    "Docker",
    "Microservices",
    "CI/CD",
    "Kafka",
    "Redis",
  ],
  primaryResponsibilities: [
    "Operate Kubernetes clusters across AWS infrastructure",
    "Develop high-performance Go backend microservices",
    "Manage stream processing with Kafka and low-latency cache with Redis",
  ],
  senioritySignals: ["5+ years experience", "Production distributed systems"],
  domainSignals: ["Cloud infrastructure", "High-throughput telemetry"],
  requirements: [
    {
      id: "req-docker",
      text: "Docker",
      category: "technology",
      importance: "required",
    },
    {
      id: "req-k8s",
      text: "Kubernetes",
      category: "technology",
      importance: "required",
    },
    {
      id: "req-go",
      text: "Go",
      category: "technology",
      importance: "required",
    },
    {
      id: "req-aws",
      text: "AWS",
      category: "technology",
      importance: "required",
    },
    {
      id: "req-kafka",
      text: "Kafka",
      category: "technology",
      importance: "required",
    },
    {
      id: "req-redis",
      text: "Redis",
      category: "technology",
      importance: "preferred",
    },
    {
      id: "req-cicd",
      text: "CI/CD",
      category: "skill",
      importance: "required",
    },
  ],
};

/**
 * Job with Hard Blocker
 */
export const blockerJob: JobAnalysis = {
  company: "DefenseTech Gov",
  role: "Principal Systems Architect",
  summary:
    "Requires active Top Secret security clearance and 10+ years of kernel systems experience.",
  keywords: ["Security Clearance", "Kernel", "C++", "Architecture"],
  primaryResponsibilities: ["Direct secure kernel platform development"],
  senioritySignals: ["10+ years required"],
  domainSignals: ["Defense", "National security"],
  blockerSignals: ["Must hold active Top Secret security clearance"],
  minYearsExperience: 10,
  requirements: [
    {
      id: "req-clearance",
      text: "Top Secret Security Clearance",
      category: "other",
      importance: "required",
      tier: "blocker",
    },
    {
      id: "req-years",
      text: "10+ years software engineering experience",
      category: "experience",
      importance: "required",
      tier: "blocker",
    },
    {
      id: "req-cpp",
      text: "C++",
      category: "technology",
      importance: "required",
    },
  ],
};
