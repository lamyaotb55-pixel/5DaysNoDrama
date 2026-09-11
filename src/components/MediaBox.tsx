import { Play } from "lucide-react";

/**
 * Exercise demonstration slot. Holds the space for a movement image/GIF and
 * keeps the active workout screen visual without adding clutter.
 */
export function MediaBox({ name, compact = false }: { name: string; compact?: boolean }) {
  const initials = name
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={
        "warm-wash relative w-full overflow-hidden rounded-xl border border-border " +
        (compact ? "aspect-square" : "aspect-[4/3]")
      }
      role="img"
      aria-label={`${name} demonstration`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-3xl text-ink/45">{initials}</span>
      </div>
      <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-card/85 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
        <Play className="size-2.5" aria-hidden /> Demo
      </span>
    </div>
  );
}
