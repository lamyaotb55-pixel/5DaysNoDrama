export type PlanId = "lose-weight" | "tone-up" | "build-muscle";

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  perSide?: boolean | undefined;
  superset?: string | undefined;
  /** Key lift tracked across phases — shown with a subtle "progression lift" label. */
  anchor?: boolean | undefined;
  /** Optional image/GIF URL used by the exercise demo box. */
  media?: string | undefined;
};

export type Circuit = {
  name: string;
  rounds: number;
  items: { name: string; reps: string }[];
};

export type Finisher = {
  label: string;
  detail: string;
  optional?: boolean;
};

export type Day = {
  day: number;
  title: string;
  focus: string;
  exercises: Exercise[];
  circuit?: Circuit;
  finisher?: Finisher;
};

export type Plan = {
  id: PlanId;
  name: string;
  slogan: string;
  label: string;
  goal: string;
  style: string;
  days: Day[];
};

export const PLANS: Plan[] = [
  {
    id: "lose-weight",
    name: "Lose Weight",
    slogan: "Move More. Get Stronger. Burn More.",
    label: "Fat Loss + Conditioning",
    goal: "Fat loss, increased activity, strength maintenance and conditioning.",
    style:
      "Moderate resistance training, higher repetitions, shorter rest periods, full-body movement and cardio finishers.",
    days: [
      {
        day: 1,
        title: "Lower Body",
        focus: "Legs + Cardio",
        exercises: [
          { name: "Goblet Squat", sets: 3, reps: "12–15" },
          { name: "Romanian Deadlift", sets: 3, reps: "10–12" },
          { name: "Reverse Lunges", sets: 3, reps: "10", perSide: true },
          { name: "Leg Press", sets: 3, reps: "12–15" },
          { name: "Hip Abductor", sets: 3, reps: "15–20" },
        ],
        finisher: { label: "Cardio Finisher", detail: "15–20 min incline treadmill walk" },
      },
      {
        day: 2,
        title: "Upper Body",
        focus: "Back, Shoulders + Core",
        exercises: [
          { name: "Lat Pulldown", sets: 3, reps: "10–12" },
          { name: "Seated Cable Row", sets: 3, reps: "10–12" },
          { name: "Dumbbell Shoulder Press", sets: 3, reps: "10–12" },
          { name: "Chest Press", sets: 3, reps: "10–12" },
          { name: "Dumbbell Lateral Raise", sets: 3, reps: "12–15" },
        ],
        circuit: {
          name: "Core Circuit",
          rounds: 3,
          items: [
            { name: "Cable Crunch", reps: "12–15 reps" },
            { name: "Bicycle Crunch", reps: "20 reps total" },
            { name: "Plank Knee to Elbow", reps: "10 reps per side" },
          ],
        },
      },
      {
        day: 3,
        title: "Full Body Metabolic",
        focus: "Supersets + Cardio",
        exercises: [
          { name: "Dumbbell Squat", sets: 3, reps: "12", superset: "Superset A" },
          { name: "Dumbbell Row", sets: 3, reps: "12", superset: "Superset A" },
          { name: "Dumbbell Romanian Deadlift", sets: 3, reps: "12", superset: "Superset B" },
          { name: "Dumbbell Shoulder Press", sets: 3, reps: "12", superset: "Superset B" },
          { name: "Step Ups", sets: 3, reps: "10", perSide: true, superset: "Superset C" },
          { name: "Face Pull", sets: 3, reps: "12–15", superset: "Superset C" },
        ],
        finisher: { label: "Cardio Finisher", detail: "10–15 min cardio of choice" },
      },
      {
        day: 4,
        title: "Lower Body",
        focus: "Glutes + Core",
        exercises: [
          { name: "Hip Thrust", sets: 3, reps: "10–12" },
          { name: "Bulgarian Split Squat", sets: 3, reps: "10", perSide: true },
          { name: "Seated Leg Curl", sets: 3, reps: "12–15" },
          { name: "Leg Extension", sets: 3, reps: "12–15" },
          { name: "Cable Kickback", sets: 3, reps: "12–15", perSide: true },
        ],
        circuit: {
          name: "Core Circuit",
          rounds: 3,
          items: [
            { name: "Hanging Leg Raise", reps: "10–12 reps" },
            { name: "Cable Crunch", reps: "12–15 reps" },
            { name: "Russian Twist", reps: "20 reps total" },
          ],
        },
      },
      {
        day: 5,
        title: "Full Body",
        focus: "Strength + Conditioning",
        exercises: [
          { name: "Leg Press", sets: 3, reps: "12" },
          { name: "Glute Bridge", sets: 3, reps: "15" },
          { name: "Neutral-Grip Lat Pulldown", sets: 3, reps: "12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "12" },
          { name: "Dumbbell Lateral Raise", sets: 2, reps: "15" },
        ],
        finisher: {
          label: "Conditioning Finisher",
          detail: "20–30 min incline walk, StairMaster or cardio of choice",
        },
      },
    ],
  },
  {
    id: "tone-up",
    name: "Tone Up",
    slogan: "Shape. Define. Strengthen.",
    label: "Balanced Strength + Definition",
    goal: "Shape, definition, strength and balanced physique development.",
    style:
      "Moderate resistance, controlled repetitions, balanced upper/lower-body training and progressive strength development.",
    days: [
      {
        day: 1,
        title: "Lower Body",
        focus: "Glutes + Quads",
        exercises: [
          { name: "Hip Thrust", sets: 4, reps: "8–10" },
          { name: "Bulgarian Split Squat", sets: 3, reps: "8–10", perSide: true },
          { name: "Leg Press", sets: 3, reps: "10–12" },
          { name: "Step Ups", sets: 3, reps: "10", perSide: true },
          { name: "Cable Kickbacks", sets: 3, reps: "12–15", perSide: true },
          { name: "Hip Abductor", sets: 3, reps: "15–20" },
        ],
      },
      {
        day: 2,
        title: "Upper Body",
        focus: "Back + Shoulders",
        exercises: [
          { name: "Lat Pulldown", sets: 3, reps: "8–12" },
          { name: "Seated Cable Row", sets: 3, reps: "8–12" },
          { name: "Seated Dumbbell Shoulder Press", sets: 3, reps: "8–10" },
          { name: "Single-Arm Dumbbell Row", sets: 3, reps: "10", perSide: true },
          { name: "Dumbbell Lateral Raise", sets: 3, reps: "12–15" },
          { name: "Face Pull", sets: 3, reps: "12–15" },
        ],
      },
      {
        day: 3,
        title: "Lower Body",
        focus: "Glutes + Hamstrings",
        exercises: [
          { name: "Romanian Deadlift", sets: 4, reps: "8–10" },
          { name: "Smith Machine Squat", sets: 3, reps: "8–10" },
          { name: "Reverse / Curtsy Lunges", sets: 3, reps: "10", perSide: true },
          { name: "Seated Leg Curl", sets: 3, reps: "10–12" },
          { name: "45° Glute-Biased Back Extension", sets: 3, reps: "10–12" },
          { name: "Single-Leg Hip Abductor", sets: 3, reps: "12–15", perSide: true },
        ],
      },
      {
        day: 4,
        title: "Upper Body",
        focus: "Balanced Upper",
        exercises: [
          { name: "Neutral-Grip Lat Pulldown", sets: 3, reps: "8–12" },
          { name: "Chest-Supported Row", sets: 3, reps: "8–12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "8–12" },
          { name: "Rear Delt Fly", sets: 3, reps: "12–15" },
          { name: "Hammer Curl", sets: 3, reps: "10–12" },
          { name: "Cable Triceps Pushdown", sets: 3, reps: "10–12" },
        ],
      },
      {
        day: 5,
        title: "Full Body Light",
        focus: "Full Body + Core",
        exercises: [
          { name: "Goblet Squat", sets: 3, reps: "12" },
          { name: "Glute Bridge", sets: 3, reps: "12–15" },
          { name: "Cable Bent Over Row", sets: 3, reps: "12" },
          { name: "Dumbbell Shoulder Press", sets: 2, reps: "12" },
        ],
        circuit: {
          name: "Core Circuit",
          rounds: 3,
          items: [
            { name: "Incline Crunch", reps: "12–15 reps" },
            { name: "Russian Twist", reps: "20 reps total" },
            { name: "Plank", reps: "30–45 seconds" },
          ],
        },
        finisher: {
          label: "Optional Finisher",
          detail: "30 min incline walk, 15 min StairMaster or cardio of choice",
          optional: true,
        },
      },
    ],
  },
  {
    id: "build-muscle",
    name: "Build Muscle",
    slogan: "Lift. Progress. Build.",
    label: "Muscle Growth + Strength",
    goal: "Build muscle, increase strength and develop glutes, legs, back, shoulders and upper body.",
    style:
      "Hypertrophy-focused resistance training, heavier loads, progressive overload and longer rest periods.",
    days: [
      {
        day: 1,
        title: "Lower Body",
        focus: "Quads + Glutes",
        exercises: [
          { name: "Smith Machine Squat", sets: 4, reps: "6–8" },
          { name: "Hip Thrust", sets: 4, reps: "8–10" },
          { name: "Leg Press", sets: 3, reps: "8–12" },
          { name: "Bulgarian Split Squat", sets: 3, reps: "8–10", perSide: true },
          { name: "Leg Extension", sets: 3, reps: "10–15" },
          { name: "Hip Abductor", sets: 3, reps: "15–20" },
        ],
      },
      {
        day: 2,
        title: "Upper Body",
        focus: "Back + Biceps",
        exercises: [
          { name: "Lat Pulldown", sets: 4, reps: "8–10" },
          { name: "Chest-Supported Row", sets: 4, reps: "8–10" },
          { name: "Single-Arm Dumbbell Row", sets: 3, reps: "8–12", perSide: true },
          { name: "Rear Delt Fly", sets: 3, reps: "12–15" },
          { name: "Dumbbell Biceps Curl", sets: 3, reps: "8–12" },
          { name: "Hammer Curl", sets: 3, reps: "10–12" },
        ],
      },
      {
        day: 3,
        title: "Lower Body",
        focus: "Hamstrings + Glutes",
        exercises: [
          { name: "Romanian Deadlift", sets: 4, reps: "6–10" },
          { name: "Hip Thrust", sets: 4, reps: "8–10" },
          { name: "Seated Leg Curl", sets: 4, reps: "8–12" },
          { name: "Reverse Lunge", sets: 3, reps: "8–10", perSide: true },
          { name: "45° Glute-Biased Back Extension", sets: 3, reps: "10–12" },
          { name: "Cable Kickback", sets: 3, reps: "12–15", perSide: true },
        ],
      },
      {
        day: 4,
        title: "Upper Body",
        focus: "Shoulders + Chest + Triceps",
        exercises: [
          { name: "Seated Dumbbell Shoulder Press", sets: 4, reps: "6–10" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "8–10" },
          { name: "Dumbbell Lateral Raise", sets: 4, reps: "12–15" },
          { name: "Cable / Machine Chest Fly", sets: 3, reps: "10–15" },
          { name: "Cable Triceps Pushdown", sets: 3, reps: "10–12" },
          { name: "Overhead Triceps Extension", sets: 3, reps: "10–12" },
        ],
      },
      {
        day: 5,
        title: "Lower Body",
        focus: "Glute Focus",
        exercises: [
          { name: "Hip Thrust", sets: 4, reps: "6–8" },
          { name: "Smith Machine Bulgarian Split Squat", sets: 3, reps: "8–10", perSide: true },
          { name: "Romanian Deadlift", sets: 3, reps: "8–10" },
          { name: "Step Ups", sets: 3, reps: "10", perSide: true },
          { name: "Cable Kickback", sets: 3, reps: "12–15", perSide: true },
          { name: "Hip Abductor", sets: 3, reps: "15–20" },
        ],
      },
    ],
  },
];

export function getPlan(id: string | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/* ---------- 8-week structure, 2 phases ----------
 * Every plan runs for 8 weeks of a 5-day split. Weeks 1–4 use the phase 1
 * templates (plan.days), weeks 5–8 use the phase 2 templates. Days are
 * addressed by an absolute number 1–40; week 1 is days 1–5, and so on. */

export const WEEKS = 8;
export const DAYS_PER_WEEK = 5;
export const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK;
export const WEEKS_PER_PHASE = 4;

export const weekOf = (absDayNo: number) => Math.ceil(absDayNo / DAYS_PER_WEEK);
export const dayInWeek = (absDayNo: number) => ((absDayNo - 1) % DAYS_PER_WEEK) + 1;
export const absDay = (week: number, dayNo: number) => (week - 1) * DAYS_PER_WEEK + dayNo;

export type PhaseNo = 1 | 2;

export type Phase = {
  no: PhaseNo;
  name: string;
  purpose: string;
  firstWeek: number;
  lastWeek: number;
};

export const PHASES: Phase[] = [
  {
    no: 1,
    name: "Build The Base",
    purpose: "Learn the movements, find your working weights, build consistency.",
    firstWeek: 1,
    lastWeek: 4,
  },
  {
    no: 2,
    name: "Level It Up 🌶️",
    purpose: "New variations, more stimulus, keep the progression going.",
    firstWeek: 5,
    lastWeek: 8,
  },
];

export const phaseOf = (week: number): PhaseNo => (week <= WEEKS_PER_PHASE ? 1 : 2);
export const phaseOfDay = (absDayNo: number): PhaseNo => phaseOf(weekOf(absDayNo));
export const phaseInfo = (no: PhaseNo): Phase => PHASES[no - 1]!;

/** Weekly objective inside a phase (repeats for weeks 5–8). */
export type WeekGoal = { title: string; copy: string; nudge: "base" | "reps" | "load" | "own" };

export const WEEK_GOALS: WeekGoal[] = [
  { title: "Find Your Base", copy: "Find your working weight. Good form first.", nudge: "base" },
  { title: "Beat Your Reps", copy: "Same weight. Can you beat last week?", nudge: "reps" },
  {
    title: "Add A Little 🌶️",
    copy: "Hit the top of the rep range? Add a little weight.",
    nudge: "load",
  },
  { title: "Own It", copy: "Finish the phase stronger than you started.", nudge: "own" },
];

export const weekGoal = (week: number): WeekGoal =>
  WEEK_GOALS[(week - 1) % WEEKS_PER_PHASE] ?? WEEK_GOALS[0]!;

/** The 5 day templates that serve a given phase. */
export function phaseDays(plan: Plan, phase: PhaseNo): Day[] {
  return phase === 1 ? plan.days : (PHASE2[plan.id] ?? plan.days);
}

/** The 5 day templates that serve a given week. */
export function weekTemplates(plan: Plan, week: number): Day[] {
  return phaseDays(plan, phaseOf(week));
}

/** The template day (1–5) behind any absolute day number. */
export function templateDay(plan: Plan, absDayNo: number): Day | undefined {
  return weekTemplates(plan, weekOf(absDayNo)).find((d) => d.day === dayInWeek(absDayNo));
}

export function getDay(plan: Plan, day: number): Day | undefined {
  if (!Number.isFinite(day) || day < 1 || day > TOTAL_DAYS) return undefined;
  const template = templateDay(plan, day);
  return template ? { ...template, day } : undefined;
}

/** The five days of one week, numbered absolutely. */
export function weekDays(plan: Plan, week: number): Day[] {
  return weekTemplates(plan, week).map((d) => ({ ...d, day: absDay(week, d.day) }));
}

/** All 40 days of the plan. */
export function allDays(plan: Plan): Day[] {
  return Array.from({ length: WEEKS }, (_, i) => weekDays(plan, i + 1)).flat();
}

/** Rough duration estimate: working sets + circuit + finisher. */
export function estimateMinutes(day: Day): number {
  const sets = day.exercises.reduce((n, e) => n + e.sets, 0);
  let mins = sets * 3.5 + 8;
  if (day.circuit) mins += day.circuit.rounds * 3;
  if (day.finisher && !day.finisher.optional) mins += 18;
  return Math.round(mins / 5) * 5;
}

/** Parse "8–10" / "12" / "10" into a min/max rep range. */
export function repRange(reps: string): { min: number; max: number } {
  const nums = reps.match(/\d+/g)?.map(Number) ?? [10];
  const min = nums[0] ?? 10;
  const max = nums[1] ?? min;
  return { min, max };
}

/* ---------- Day 5 "how will you show up today?" option ---------- */

export type DayOption = {
  /** 'walk' = 10K step challenge, 'mini' = short glute challenge */
  kind: "walk" | "mini";
  /** Secondary button label */
  button: string;
  headline: string;
  goal: string;
  doneLabel: string;
  items?: { name: string; reps: string }[];
};

const DAY_OPTIONS: Record<PlanId, DayOption> = {
  "lose-weight": {
    kind: "walk",
    button: "I'll Walk",
    headline: "10K. That's the deal. 🚶",
    goal: "Goal: 10,000+ steps",
    doneLabel: "10K & Done",
  },
  "tone-up": {
    kind: "walk",
    button: "I'll Walk",
    headline: "10K. That's the deal. 🚶",
    goal: "Goal: 10,000+ steps",
    doneLabel: "10K & Done",
  },
  "build-muscle": {
    kind: "mini",
    button: "I'll Mini",
    headline: "The Mini 🍑 — 10–15 min glute challenge",
    goal: "10–15 minutes, no equipment needed",
    doneLabel: "Mini Done",
    items: [
      { name: "Glute Bridge", reps: "3 × 20 reps" },
      { name: "Bodyweight Bulgarian Split Squat", reps: "2 × 12 per leg" },
      { name: "Bodyweight or Banded Hip Abduction", reps: "3 × 20 reps" },
      { name: "Frog Pumps", reps: "2 × 25 reps" },
    ],
  },
};

/** The alternative way to show up on day 5 of a plan. */
export function dayOption(planId: string | undefined, absDayNo: number): DayOption | undefined {
  if (!planId || dayInWeek(absDayNo) !== DAYS_PER_WEEK) return undefined;
  return DAY_OPTIONS[planId as PlanId];
}
