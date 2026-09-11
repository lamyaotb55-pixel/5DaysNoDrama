export type PlanId = "lose-weight" | "tone-up" | "build-muscle";

export type Exercise = {
  name: string;
  cue: string;
  emoji: string;
  reps: number;
  rounds: number;
  weight: number; // starting suggestion in kg, 0 = bodyweight
};

export type Day = {
  title: string;
  focus: string;
  exercises: Exercise[];
};

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  emoji: string;
  days: Day[];
};

export const WEEKS = 8;

export const PLANS: Plan[] = [
  {
    id: "lose-weight",
    name: "Lose Weight",
    tagline: "Fat-burning circuits, high energy, low equipment.",
    emoji: "🔥",
    days: [
      {
        title: "Day 1",
        focus: "Full Body Burn",
        exercises: [
          { name: "Jumping Jacks", cue: "Land soft, stay light on your feet.", emoji: "🤸", reps: 30, rounds: 3, weight: 0 },
          { name: "Bodyweight Squat", cue: "Chest tall, knees track over toes.", emoji: "🦵", reps: 15, rounds: 3, weight: 0 },
          { name: "Mountain Climbers", cue: "Hips low, drive knees fast.", emoji: "⛰️", reps: 20, rounds: 3, weight: 0 },
          { name: "Plank Hold", cue: "Squeeze glutes, breathe steady (seconds).", emoji: "🧘", reps: 30, rounds: 3, weight: 0 },
        ],
      },
      {
        title: "Day 2",
        focus: "Cardio + Core",
        exercises: [
          { name: "High Knees", cue: "Pump arms, quick feet.", emoji: "🏃", reps: 40, rounds: 3, weight: 0 },
          { name: "Bicycle Crunch", cue: "Elbow to opposite knee, slow twist.", emoji: "🚴", reps: 20, rounds: 3, weight: 0 },
          { name: "Dead Bug", cue: "Ribs down, low back glued to floor.", emoji: "🐞", reps: 12, rounds: 3, weight: 0 },
          { name: "Russian Twist", cue: "Rotate from the ribcage.", emoji: "🌀", reps: 20, rounds: 3, weight: 4 },
        ],
      },
      {
        title: "Day 3",
        focus: "Lower Body Sculpt",
        exercises: [
          { name: "Reverse Lunge", cue: "Step back long, front knee stacked.", emoji: "🦿", reps: 12, rounds: 3, weight: 6 },
          { name: "Glute Bridge", cue: "Drive hips up, pause at the top.", emoji: "🌉", reps: 15, rounds: 3, weight: 0 },
          { name: "Sumo Squat", cue: "Toes out, knees wide.", emoji: "🤼", reps: 15, rounds: 3, weight: 8 },
          { name: "Calf Raise", cue: "Full stretch at the bottom.", emoji: "🦶", reps: 20, rounds: 3, weight: 0 },
        ],
      },
      {
        title: "Day 4",
        focus: "Upper Body + HIIT",
        exercises: [
          { name: "Incline Push-Up", cue: "Elbows at 45°, body in one line.", emoji: "💪", reps: 12, rounds: 3, weight: 0 },
          { name: "Bent-Over Row", cue: "Pull to the hip, squeeze the back.", emoji: "🚣", reps: 12, rounds: 3, weight: 8 },
          { name: "Shoulder Press", cue: "Press up, don't flare the ribs.", emoji: "🏋️", reps: 12, rounds: 3, weight: 6 },
          { name: "Burpee", cue: "Chest to floor, explode up.", emoji: "💥", reps: 10, rounds: 3, weight: 0 },
        ],
      },
      {
        title: "Day 5",
        focus: "Metabolic Finisher",
        exercises: [
          { name: "Squat Jump", cue: "Absorb the landing.", emoji: "🚀", reps: 12, rounds: 4, weight: 0 },
          { name: "Skater Hops", cue: "Wide lateral push.", emoji: "⛸️", reps: 20, rounds: 3, weight: 0 },
          { name: "Push-Up to Plank Tap", cue: "Hips quiet, tap slow.", emoji: "🤚", reps: 12, rounds: 3, weight: 0 },
          { name: "Brisk Walk / Jog", cue: "Steady pace (minutes).", emoji: "🚶", reps: 15, rounds: 1, weight: 0 },
        ],
      },
    ],
  },
  {
    id: "tone-up",
    name: "Tone Up",
    tagline: "Lean strength, control and definition.",
    emoji: "✨",
    days: [
      {
        title: "Day 1",
        focus: "Glutes & Hamstrings",
        exercises: [
          { name: "Romanian Deadlift", cue: "Hinge at the hips, flat back.", emoji: "🪢", reps: 12, rounds: 3, weight: 12 },
          { name: "Hip Thrust", cue: "Chin tucked, ribs down.", emoji: "🌉", reps: 15, rounds: 3, weight: 15 },
          { name: "Curtsy Lunge", cue: "Cross behind, stay tall.", emoji: "💃", reps: 12, rounds: 3, weight: 6 },
          { name: "Band Kickback", cue: "Squeeze at the top for 1s.", emoji: "🎀", reps: 15, rounds: 3, weight: 0 },
        ],
      },
      {
        title: "Day 2",
        focus: "Arms & Shoulders",
        exercises: [
          { name: "Lateral Raise", cue: "Lead with elbows, no swing.", emoji: "🕊️", reps: 15, rounds: 3, weight: 4 },
          { name: "Bicep Curl", cue: "Elbows pinned to your sides.", emoji: "💪", reps: 12, rounds: 3, weight: 6 },
          { name: "Triceps Kickback", cue: "Straighten fully, slow return.", emoji: "🔙", reps: 12, rounds: 3, weight: 4 },
          { name: "Front Raise", cue: "Stop at shoulder height.", emoji: "🙌", reps: 12, rounds: 3, weight: 4 },
        ],
      },
      {
        title: "Day 3",
        focus: "Core & Waist",
        exercises: [
          { name: "Hollow Hold", cue: "Low back pressed down (seconds).", emoji: "🌙", reps: 30, rounds: 3, weight: 0 },
          { name: "Side Plank", cue: "Stack shoulders, lift hips (seconds).", emoji: "📐", reps: 30, rounds: 3, weight: 0 },
          { name: "Leg Raise", cue: "Lower slowly, no momentum.", emoji: "🦵", reps: 12, rounds: 3, weight: 0 },
          { name: "Pallof Press", cue: "Resist the rotation.", emoji: "🧲", reps: 12, rounds: 3, weight: 5 },
        ],
      },
      {
        title: "Day 4",
        focus: "Back & Posture",
        exercises: [
          { name: "Single-Arm Row", cue: "Long pull, no twisting.", emoji: "🚣", reps: 12, rounds: 3, weight: 10 },
          { name: "Reverse Fly", cue: "Wide arc, light weight.", emoji: "🦋", reps: 15, rounds: 3, weight: 4 },
          { name: "Superman Hold", cue: "Lift chest and thighs (seconds).", emoji: "🦸", reps: 25, rounds: 3, weight: 0 },
          { name: "Face Pull", cue: "Hands to ears, elbows high.", emoji: "🎣", reps: 15, rounds: 3, weight: 6 },
        ],
      },
      {
        title: "Day 5",
        focus: "Full Body Flow",
        exercises: [
          { name: "Goblet Squat", cue: "Elbows inside knees at the bottom.", emoji: "🏺", reps: 15, rounds: 3, weight: 10 },
          { name: "Step-Up", cue: "Drive through the whole foot.", emoji: "🪜", reps: 12, rounds: 3, weight: 6 },
          { name: "Push-Up", cue: "One straight line, full range.", emoji: "💥", reps: 10, rounds: 3, weight: 0 },
          { name: "Bird Dog", cue: "Reach long, hips level.", emoji: "🐕", reps: 12, rounds: 3, weight: 0 },
        ],
      },
    ],
  },
  {
    id: "build-muscle",
    name: "Build Muscle",
    tagline: "Progressive overload, heavier lifts, real growth.",
    emoji: "🏆",
    days: [
      {
        title: "Day 1",
        focus: "Chest & Triceps",
        exercises: [
          { name: "Bench Press", cue: "Bar to mid-chest, elbows tucked.", emoji: "🛏️", reps: 8, rounds: 4, weight: 30 },
          { name: "Incline Dumbbell Press", cue: "Press slightly inward.", emoji: "📈", reps: 10, rounds: 3, weight: 14 },
          { name: "Chest Fly", cue: "Slight elbow bend, big stretch.", emoji: "🦋", reps: 12, rounds: 3, weight: 8 },
          { name: "Overhead Triceps Extension", cue: "Elbows close to your head.", emoji: "🔺", reps: 12, rounds: 3, weight: 10 },
        ],
      },
      {
        title: "Day 2",
        focus: "Back & Biceps",
        exercises: [
          { name: "Barbell Row", cue: "Torso steady, pull to the belly.", emoji: "🚣", reps: 8, rounds: 4, weight: 30 },
          { name: "Lat Pulldown", cue: "Chest up, elbows down.", emoji: "⬇️", reps: 10, rounds: 3, weight: 25 },
          { name: "Hammer Curl", cue: "Neutral grip, no swinging.", emoji: "🔨", reps: 12, rounds: 3, weight: 10 },
          { name: "Chin-Up / Assisted", cue: "Full hang to chin over bar.", emoji: "🧗", reps: 6, rounds: 3, weight: 0 },
        ],
      },
      {
        title: "Day 3",
        focus: "Legs",
        exercises: [
          { name: "Back Squat", cue: "Brace hard, depth over ego.", emoji: "🦵", reps: 8, rounds: 4, weight: 40 },
          { name: "Leg Press", cue: "Knees track out, don't lock hard.", emoji: "🛗", reps: 12, rounds: 3, weight: 60 },
          { name: "Walking Lunge", cue: "Long steps, upright chest.", emoji: "🚶", reps: 12, rounds: 3, weight: 12 },
          { name: "Seated Calf Raise", cue: "Pause 2s at the top.", emoji: "🦶", reps: 15, rounds: 4, weight: 20 },
        ],
      },
      {
        title: "Day 4",
        focus: "Shoulders & Arms",
        exercises: [
          { name: "Overhead Press", cue: "Head through at the top.", emoji: "🏋️", reps: 8, rounds: 4, weight: 20 },
          { name: "Arnold Press", cue: "Rotate smoothly, control down.", emoji: "🔄", reps: 10, rounds: 3, weight: 10 },
          { name: "Upright Row", cue: "Elbows lead, stop at chest.", emoji: "⬆️", reps: 12, rounds: 3, weight: 15 },
          { name: "Cable Curl", cue: "Constant tension, no rest at bottom.", emoji: "💪", reps: 12, rounds: 3, weight: 12 },
        ],
      },
      {
        title: "Day 5",
        focus: "Posterior & Power",
        exercises: [
          { name: "Deadlift", cue: "Bar close, push the floor away.", emoji: "🪨", reps: 5, rounds: 4, weight: 50 },
          { name: "Hip Thrust", cue: "Full lockout, ribs down.", emoji: "🌉", reps: 10, rounds: 3, weight: 30 },
          { name: "Pull-Up", cue: "Control the descent.", emoji: "🧗", reps: 6, rounds: 4, weight: 0 },
          { name: "Farmer Carry", cue: "Tall posture, steps (meters).", emoji: "🧺", reps: 30, rounds: 3, weight: 20 },
        ],
      },
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Progressive overload: week 1 is the baseline, later weeks add rounds / reps / load. */
export function progress(ex: Exercise, week: number) {
  const w = Math.max(1, Math.min(WEEKS, week));
  const block = Math.floor((w - 1) / 3); // 0,0,0,1,1,1,2,2
  return {
    reps: ex.reps + (w >= 5 ? 2 : 0),
    rounds: ex.rounds + block,
    weight: ex.weight === 0 ? 0 : Math.round(ex.weight * (1 + 0.05 * (w - 1))),
  };
}

export const ENCOURAGEMENTS = [
  "Smashed it! That's another one in the bank. 💥",
  "Strong work — future you says thank you. ✨",
  "You showed up and finished. That's the whole secret. 🔥",
  "Consistency looks good on you. Keep going! 🚀",
  "One day stronger than yesterday. 💪",
  "That's how progress is built — rep by rep. 🏆",
];
