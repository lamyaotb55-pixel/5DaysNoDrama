import { Minus, Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DEFAULT_REST_EXERCISE, DEFAULT_REST_SET, setRestTimes, useStore } from "@/lib/store";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Rest timer lengths, adjustable in 15-second steps. */
export function RestSettings() {
  const t = useT();
  const state = useStore();
  const rows = [
    {
      key: "restSet" as const,
      label: t("rest.setting.sets"),
      value: state.restSet ?? DEFAULT_REST_SET,
    },
    {
      key: "restExercise" as const,
      label: t("rest.setting.exercises"),
      value: state.restExercise ?? DEFAULT_REST_EXERCISE,
    },
  ];
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-bold text-muted-foreground uppercase">
        {t("rest.setting.title")}
      </p>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{r.label}</span>
          <span className="inline-flex items-center gap-1.5">
            <button
              type="button"
              aria-label={t("rest.setting.less", { what: r.label })}
              disabled={r.value <= 15}
              onClick={() => setRestTimes({ [r.key]: r.value - 15 })}
              className="grid size-8 place-items-center rounded-full border border-border bg-card disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span className="w-12 text-center font-display text-base tabular-nums" dir="ltr">
              {fmt(r.value)}
            </span>
            <button
              type="button"
              aria-label={t("rest.setting.more", { what: r.label })}
              disabled={r.value >= 600}
              onClick={() => setRestTimes({ [r.key]: r.value + 15 })}
              className="grid size-8 place-items-center rounded-full border border-border bg-card disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
