import { useState } from "react";
import { Footprints } from "lucide-react";
import { ExerciseName } from "./ExerciseName";
import { MediaBox } from "./MediaBox";
import { useT } from "@/lib/i18n";
import { PHASES, type Day, type PhaseNo } from "@/lib/program";
import type { CommunityContent } from "@/lib/store";

/** Read-only view of a plan's 10 day templates (weeks 1–4 and 5–8). */
export function PlanPreview({ content }: { content: CommunityContent }) {
  const t = useT();
  const [phase, setPhase] = useState<PhaseNo>(1);
  const days: Day[] = phase === 1 ? content.days : content.phase2;

  return (
    <div>
      <div className="flex gap-2" role="tablist" aria-label={t("plan.phases")}>
        {PHASES.map((ph) => (
          <button
            key={ph.no}
            type="button"
            role="tab"
            aria-selected={phase === ph.no}
            onClick={() => setPhase(ph.no)}
            className={
              "flex-1 rounded-full px-3 py-2.5 text-[11px] font-bold uppercase " +
              (phase === ph.no
                ? "bg-spicy text-accent-foreground"
                : "border border-border bg-card text-muted-foreground")
            }
          >
            {ph.no === 1 ? t("plan.weeks14") : t("plan.weeks58")}
          </button>
        ))}
      </div>

      {content.day5Alt && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase">
          <Footprints className="size-3 text-pink" aria-hidden /> {t("preview.day5Option")}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {days.map((day) => (
          <section key={day.day} className="surface p-4">
            <p className="eyebrow text-muted-foreground">{t("common.dayN", { n: day.day })}</p>
            <h3 className="mt-1 text-lg leading-tight">{t.c(day.title)}</h3>
            {day.focus && <p className="text-sm text-muted-foreground">{t.c(day.focus)}</p>}
            {day.exercises.length === 0 ? (
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                {t("preview.noExercises")}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {day.exercises.map((ex, i) => (
                  <li
                    key={`${ex.name}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-2"
                  >
                    <div className="w-14 shrink-0">
                      <MediaBox name={ex.name} compact src={ex.media} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        <ExerciseName name={ex.name} />
                      </p>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        <bdi>
                          {ex.sets} × {ex.reps}
                        </bdi>
                        {ex.perSide ? ` ${t("ex.perSide")}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
