import { setUnit } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useWeights } from "@/lib/units";

/** kg | lb toggle. Changes only how weights are shown and typed; logs stay in kg. */
export function UnitSwitch({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const w = useWeights();
  return (
    <div
      role="group"
      aria-label={t("unit.switch")}
      className={"inline-flex items-center gap-2 " + (compact ? "" : "w-full justify-between")}
    >
      <span className="text-[11px] font-bold text-muted-foreground uppercase">
        {t("unit.weightsIn")}
      </span>
      <span className="inline-flex rounded-full border border-border bg-card p-0.5">
        {(["kg", "lb"] as const).map((u) => (
          <button
            key={u}
            type="button"
            aria-pressed={w.unit === u}
            onClick={() => setUnit(u)}
            className={
              "rounded-full px-3 py-1 text-[11px] font-bold uppercase " +
              (w.unit === u ? "bg-ink text-paper" : "text-muted-foreground")
            }
          >
            {u === "kg" ? t("unit.kg") : t("unit.lb")}
          </button>
        ))}
      </span>
    </div>
  );
}
