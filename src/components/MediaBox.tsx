import { Play } from "lucide-react";

/**
 * Movement preview box. Shows an animated visual placeholder for the exercise
 * demo so each workout has a dedicated media slot.
 */
export function MediaBox({ name, emoji, cue }: { name: string; emoji: string; cue: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-secondary">
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: "var(--gradient-hero)", filter: "saturate(1.1)" }}
      />
      <div className="absolute inset-0 grid-fade opacity-40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="animate-bounce text-5xl drop-shadow-sm" aria-hidden>
          {emoji}
        </span>
        <span className="rounded-full bg-card/85 px-3 py-1 text-xs font-semibold text-foreground">
          {name}
        </span>
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-card/85 px-2 py-1 text-[10px] font-medium text-muted-foreground">
        <Play className="size-3" aria-hidden />
        Movement preview
      </div>
      <span className="sr-only">{cue}</span>
    </div>
  );
}
