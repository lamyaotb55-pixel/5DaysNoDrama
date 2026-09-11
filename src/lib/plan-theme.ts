/** Presentational accent identity per plan. */
export type PlanAccent = {
  /** Tailwind text color class */
  text: string;
  /** Tailwind background color class */
  bg: string;
  /** Foreground on top of bg */
  on: string;
  /** Soft tint background */
  soft: string;
};

const ACCENTS: Record<string, PlanAccent> = {
  "lose-weight": {
    text: "text-spicy",
    bg: "bg-spicy",
    on: "text-paper",
    soft: "bg-spicy/10",
  },
  "tone-up": {
    text: "text-pink",
    bg: "bg-pink",
    on: "text-paper",
    soft: "bg-bubblegum/40",
  },
  "build-muscle": {
    text: "text-ice",
    bg: "bg-ice",
    on: "text-ink",
    soft: "bg-ice/20",
  },
};

export function planAccent(planId: string | undefined): PlanAccent {
  return (planId && ACCENTS[planId]) || ACCENTS["lose-weight"]!;
}
