import type { Resume } from "@/features/resume/schema";

/**
 * Section 77: Critical Test Case Candidate
 * Has: Docker, Python, PostgreSQL, REST APIs, Git, Linux, RabbitMQ, CI/CD with GitHub Actions.
 * Lacks: Kubernetes, Go, AWS, Kafka, Redis.
 */
export const criticalTestCaseResume: Resume = {
  version: 1,
  basics: {
    name: "Rohan Sharma",
    headline: "Backend Software Engineer",
    email: "rohan.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    links: [
      { id: "link-gh", label: "GitHub", url: "https://github.com/rohansharma" },
      { id: "link-li", label: "LinkedIn", url: "https://linkedin.com/in/rohansharma" },
    ],
  },
  skills: [
    {
      id: "grp-languages",
      name: "Languages & Frameworks",
      skills: [
        { id: "sk-python", name: "Python" },
        { id: "sk-rest", name: "REST APIs" },
      ],
    },
    {
      id: "grp-data",
      name: "Databases & Messaging",
      skills: [
        { id: "sk-postgres", name: "PostgreSQL" },
        { id: "sk-rabbitmq", name: "RabbitMQ" },
      ],
    },
    {
      id: "grp-devops",
      name: "Infrastructure & Tools",
      skills: [
        { id: "sk-docker", name: "Docker" },
        { id: "sk-git", name: "Git" },
        { id: "sk-linux", name: "Linux" },
        { id: "sk-gh-actions", name: "GitHub Actions" },
      ],
    },
  ],
  experience: [
    {
      id: "exp-1",
      company: "InnovateTech Labs",
      role: "Backend Engineer",
      location: "Bengaluru, India",
      startDate: "July 2022",
      endDate: "Present",
      bullets: [
        {
          id: "exp-1-b1",
          text: "Engineered high-throughput Python backend services handling 1.5M daily requests with PostgreSQL and Docker containers.",
        },
        {
          id: "exp-1-b2",
          text: "Integrated asynchronous task queues using RabbitMQ to process data feeds, decreasing API latency by 35%.",
        },
        {
          id: "exp-1-b3",
          text: "Automated test and build pipelines using GitHub Actions, reducing deployment cycle times by 40%.",
        },
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Distributed Event Pipeline",
      description: "Asynchronous log indexing pipeline built with Python and PostgreSQL.",
      technologies: [
        { id: "tech-python", name: "Python" },
        { id: "tech-docker", name: "Docker" },
        { id: "tech-rabbitmq", name: "RabbitMQ" },
      ],
      links: [],
      bullets: [
        {
          id: "proj-1-b1",
          text: "Built containerized event ingest microservices using Docker and Linux, sustaining 5,000 events/second.",
        },
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "National Institute of Technology",
      degree: "Bachelor of Technology",
      field: "Computer Science and Engineering",
      location: "India",
      startDate: "August 2018",
      endDate: "May 2022",
      details: [{ id: "edu-1-d1", text: "CGPA: 8.8 / 10.0" }],
    },
  ],
};

/**
 * Section 79: Student Candidate
 */
export const studentCandidateResume: Resume = {
  version: 1,
  basics: {
    name: "Priya Patel",
    headline: "Computer Science Student",
    email: "priya.patel@example.com",
    phone: "+91 91234 56789",
    location: "Pune, India",
    links: [{ id: "link-gh", label: "GitHub", url: "https://github.com/priyapatel" }],
  },
  skills: [
    {
      id: "grp-skills",
      name: "Programming & Web",
      skills: [
        { id: "sk-cpp", name: "C++" },
        { id: "sk-python", name: "Python" },
        { id: "sk-react", name: "React" },
        { id: "sk-sql", name: "SQL" },
      ],
    },
  ],
  experience: [],
  projects: [
    {
      id: "proj-campus",
      name: "Campus Automated Course Scheduler",
      description: "Constraint-satisfaction scheduling application built in Python and React.",
      technologies: [
        { id: "t-python", name: "Python" },
        { id: "t-react", name: "React" },
      ],
      links: [],
      bullets: [
        {
          id: "proj-b1",
          text: "Designed backtracking constraint engine resolving timetable conflicts across 40 departments in under 3 seconds.",
        },
      ],
    },
  ],
  education: [
    {
      id: "edu-college",
      institution: "COEP Technological University",
      degree: "B.Tech",
      field: "Computer Engineering",
      location: "Pune, India",
      startDate: "August 2022",
      endDate: "May 2026",
      details: [{ id: "edu-d1", text: "Current CGPA: 9.1 / 10.0" }],
    },
  ],
};
