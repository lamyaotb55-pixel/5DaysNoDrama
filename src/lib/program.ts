export type PlanId = "lose-weight" | "tone-up" | "build-muscle";

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  perSide?: boolean;
  superset?: string;
  /** Optional image/GIF URL used by the exercise demo box. */
  media?: string;
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

export function getDay(plan: Plan, day: number): Day | undefined {
  return plan.days.find((d) => d.day === day);
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
