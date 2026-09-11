import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BestSet } from "@/lib/store";

export function WeightChart({ trend }: { trend: Record<string, BestSet[]> }) {
  const names = Object.keys(trend)
    .filter((n) => (trend[n]?.length ?? 0) > 0)
    .sort();
  const [selected, setSelected] = useState(names[0] ?? "");
  const active = names.includes(selected) ? selected : (names[0] ?? "");
  const data = (trend[active] ?? []).map((p, i) => ({
    session: `S${i + 1}`,
    weight: p.weight,
    reps: p.reps,
  }));

  if (!names.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Log a few weighted sets and your progression per exercise appears here.
      </p>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="eyebrow text-muted-foreground">Exercise</span>
        <select
          value={active}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
        >
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="session" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" unit="kg" />
            <Tooltip
              formatter={(value: number | string, name) =>
                name === "weight" ? [`${value} kg`, "Top set"] : [String(value), "Reps"]
              }
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--spicy)"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
