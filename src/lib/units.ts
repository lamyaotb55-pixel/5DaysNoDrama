import { useMemo } from "react";
import { useT } from "./i18n";
import { useStore, type WeightUnit } from "./store";

/* Weights are stored in kg everywhere (logs, PRs, trends, suggestions).
 * People who train in pounds see and type lb; we convert at the edges. */

export const LB_PER_KG = 2.20462262;

const trim = (n: number) => Math.round(n * 10) / 10;

export function useWeights() {
  const state = useStore();
  const t = useT();
  const unit: WeightUnit = state.unit ?? "kg";
  return useMemo(() => {
    const lb = unit === "lb";
    /** A stored kg value in the chosen unit (one decimal at most). */
    const show = (kg: number) => (kg ? trim(lb ? kg * LB_PER_KG : kg) : 0);
    return {
      unit,
      label: lb ? t("unit.lb") : t("unit.kg"),
      show,
      /** "60 kg" / "132.3 lb" */
      fmt: (kg: number) => `${t.num(show(kg))} ${lb ? t("unit.lb") : t("unit.kg")}`,
      /** A typed value in the chosen unit, as kg for storage. */
      toKg: (value: number) => (lb ? value / LB_PER_KG : value),
      /** Input step: 2.5 kg plates, 5 lb dumbbells. */
      step: lb ? 5 : 2.5,
      /** A suggested next weight, rounded to what the gym actually has. */
      target: (kg: number) => (lb ? Math.round((kg * LB_PER_KG) / 5) * 5 : trim(kg)),
      /** Training volume (weight × reps) in the chosen unit, whole number. */
      volume: (kg: number) => Math.round(lb ? kg * LB_PER_KG : kg),
    };
  }, [unit, t]);
}

export type Weights = ReturnType<typeof useWeights>;
