export type PresetKind = "university" | "job";

export interface Preset {
  id: string;
  name: string;
  kind: PresetKind;
  tagline: string;
  roleLabel: string;
  rolePlaceholder: string;
  values: string[];
  questions: { id: string; label: string; hint: string; rows?: number }[];
}

export const PRESETS: Preset[] = [
  {
    id: "oxford",
    name: "University of Oxford",
    kind: "university",
    tagline: "Tutorial-style, academic depth, intellectual curiosity",
    roleLabel: "Course",
    rolePlaceholder: "e.g. PPE, Computer Science, History",
    values: ["Intellectual curiosity", "Super-curricular reading", "Analytical thinking", "Love of the subject"],
    questions: [
      { id: "why_course", label: "Why this course?", hint: "What draws you to the subject at an academic level?", rows: 5 },
      { id: "reading", label: "Super-curricular exploration", hint: "Books, lectures, competitions or projects beyond the syllabus.", rows: 5 },
      { id: "idea", label: "An idea you've wrestled with", hint: "A problem or argument you found hard and how you thought it through.", rows: 4 },
      { id: "grades", label: "Predicted / achieved grades and admissions tests", hint: "e.g. A*A*A, MAT, TSA, LNAT", rows: 2 },
    ],
  },
  {
    id: "southampton",
    name: "University of Southampton",
    kind: "university",
    tagline: "Research-led, practical skills, community and teamwork",
    roleLabel: "Course",
    rolePlaceholder: "e.g. Engineering, Medicine, Oceanography",
    values: ["Motivation for the course", "Practical experience", "Teamwork", "Research interest"],
    questions: [
      { id: "why_course", label: "Why this course at Southampton?", hint: "Course features, facilities or research that appeal to you.", rows: 5 },
      { id: "experience", label: "Relevant experience", hint: "Work experience, volunteering, projects or placements.", rows: 5 },
      { id: "teamwork", label: "Teamwork and wider interests", hint: "Clubs, sports, societies or roles that show who you are.", rows: 4 },
      { id: "grades", label: "Predicted / achieved grades", hint: "e.g. AAB in Maths, Physics, Chemistry", rows: 2 },
    ],
  },
  {
    id: "amazon",
    name: "Amazon",
    kind: "job",
    tagline: "Leadership Principles, STAR stories, data-driven ownership",
    roleLabel: "Role",
    rolePlaceholder: "e.g. Software Development Engineer, Area Manager",
    values: ["Customer Obsession", "Ownership", "Bias for Action", "Deliver Results"],
    questions: [
      { id: "why", label: "Why Amazon and this role?", hint: "Connect your goals to Amazon's mission.", rows: 4 },
      { id: "customer", label: "Customer Obsession story", hint: "A time you went above and beyond for a customer or user (STAR).", rows: 5 },
      { id: "ownership", label: "Ownership story", hint: "A time you took responsibility beyond your remit (STAR).", rows: 5 },
      { id: "experience", label: "Work history and key skills", hint: "Roles, tools, measurable results.", rows: 4 },
    ],
  },
  {
    id: "tesco",
    name: "Tesco",
    kind: "job",
    tagline: "Customer-first, teamwork, 'Every little help'",
    roleLabel: "Role",
    rolePlaceholder: "e.g. Graduate Scheme, Customer Assistant, Store Manager",
    values: ["We treat people how they want to be treated", "We are customer focused", "We use our scale for good"],
    questions: [
      { id: "why", label: "Why Tesco?", hint: "What appeals to you about Tesco and this role?", rows: 4 },
      { id: "customer", label: "Great customer service", hint: "A time you helped a customer or person in a meaningful way.", rows: 5 },
      { id: "team", label: "Working in a team", hint: "A time you supported colleagues under pressure.", rows: 5 },
      { id: "experience", label: "Experience and availability", hint: "Previous jobs, skills, hours you can work.", rows: 3 },
    ],
  },
];

export interface SubmittedApplication {
  presetId: string;
  name: string;
  role: string;
  answers: Record<string, string>;
}

export const APP_STORAGE_KEY = "groot.application";

export function getPreset(id: string) {
  return PRESETS.find((p) => p.id === id);
}
