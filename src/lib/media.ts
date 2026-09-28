/** Default demo media per exercise, served from /public/media. */
const FILES: Record<string, string> = {
  // Squats
  "Goblet Squat": "kettlebell-goblet-squat.mp4",
  "Heel-Elevated Goblet Squat": "cable-goblet-squat.gif",
  "Dumbbell Squat": "dumbbell-front-squat.gif",
  "Sumo Goblet Squat": "dumbbell-goblet-sumo-squat.gif",
  "Smith Machine Squat": "smith-full-squat.gif",
  // Lunges, split squats, step ups
  "Reverse Lunge": "kettlebell-reverse-lunge.mp4",
  "Curtsy Lunge": "single-curtsy-lunge.mp4",
  "Walking Lunges": "dumbbell-walking-lunge.mp4",
  "Bulgarian Split Squat": "dumbell-bulgarian-split-squat.gif",
  "Glute-Biased Bulgarian Split Squat": "dumbell-bulgarian-split-squat.gif",
  "Bodyweight Bulgarian Split Squat": "dumbell-bulgarian-split-squat.gif",
  "Smith Machine Bulgarian Split Squat": "dumbell-bulgarian-split-squat.gif",
  "Step Ups": "dumbbell-glute-dominant-step-up.gif",
  "Glute-Biased Step Ups": "dumbbell-glute-dominant-step-up.gif",
  // Hinges
  "Kettlebell Romanian Deadlift": "kettlebell-romanian-deadlift.mp4",
  "Dumbbell Romanian Deadlift": "dumbbell-romanian-deadlift.mp4",
  "Barbell Romanian Deadlift": "barbell-romanian-deadlift.mp4",
  "Sumo Deadlift": "dumbbell-sumo-deadlift.mp4",
  "45° Glute-Biased Back Extension": "45-degree-hip-extension-glute-focused.gif",
  // Glutes
  "Hip Thrust": "dumbbell-hip-thrust.gif",
  "Smith Machine Hip Thrust": "smith-hip-thrust.gif",
  "Glute Bridge": "heel-glute-bridge.gif",
  "Smith Machine Glute Bridge": "dumbbells-glute-bridge.png",
  "Frog Pumps": "bodyweight-frog-pump.mp4",
  "Cable Kickback": "cable-diagonal-kickback.mp4",
  "Hip Abductor": "seated-hip-abduction.gif",
  "Single-Leg Hip Abductor": "single-leg-hip-abduction.gif",
  "Bodyweight or Banded Hip Abduction": "side-hip-abduction.gif",
  // Machines
  "Leg Press": "seated-leg-press.gif",
  "Single-Leg Leg Press": "seated-single-leg-squat-calf-raise-on-leg-press-machine.mp4",
  "Leg Extension": "seated-leg-extension.gif",
  "Lying Leg Curl": "lying-leg-curl.mp4",
  // Back
  "Lat Pulldown": "lat-pulldown.gif",
  "Wide-Grip Lat Pulldown": "lat-pulldown.gif",
  "Neutral-Grip Lat Pulldown": "cable-neutral-grip-lat-pulldown.gif",
  "Seated Cable Row": "cable-seated-row.gif",
  "Cable Bent-Over Row": "cable-row.gif",
  "Single-Arm Cable Row": "cable-split-stance-single-arm-row.mp4",
  "Chest-Supported Row": "dumbbell-row-with-chest-supported.png",
  "Chest-Supported Dumbbell Row": "dumbbell-row-with-chest-supported.png",
  "Single-Arm Dumbbell Row": "dumbbell-single-arm-row.mp4",
  "Dumbbell Row": "dumbbell-renegade-row.gif",
  "Face Pull": "cable-face-pull.gif",
  "Rear Delt Fly": "dumbbell-rear-fly.png",
  // Chest
  "Dumbbell Floor Press": "dumbbell-lying-on-floor-chest-press.mp4",
  "Dumbbell Chest Press": "dumbbell-incline-bench-press.png",
  "Incline Dumbbell Press": "dumbbell-incline-bench-press.png",
  "Cable / Machine Chest Fly": "cable-middle-fly.gif",
  "Machine Chest Fly": "machine-seated-fly.gif",
  // Shoulders
  "Dumbbell Shoulder Press": "dumbbell-bench-seated-press.mp4",
  "Seated Dumbbell Shoulder Press": "dumbbell-seated-shoulder-press.png",
  "Arnold Press": "dumbbell-arnold-press.mp4",
  "Dumbbell Lateral Raise": "dumbbell-lateral-raise.gif",
  "Front-to-Side Dumbbell Raise": "dumbbell-lateral-to-front-raise.mp4",
  // Arms
  "Dumbbell Biceps Curl": "ez-barbell-seated-curls.png",
  "Incline Dumbbell Curl": "dumbbell-incline-stretch-curl.mp4",
  "Hammer Curl": "kettlebell-standing-hammer-curl.mp4",
  "Cable Hammer Curl": "cable-hammer-curl.gif",
  "Cable Triceps Pushdown": "cable-triceps-pushdown.png",
  "Single-Arm Triceps Pushdown": "cable-triceps-pushdown.png",
  "Overhead Triceps Extension": "bottle-weighted-overhead-triceps-extension.gif",
  "Overhead Cable Triceps Extension": "cable-overhead-triceps-extension.gif",
};

export function defaultMedia(exerciseName: string): string | undefined {
  const file = FILES[exerciseName.trim()];
  return file ? `/media/${file}` : undefined;
}
