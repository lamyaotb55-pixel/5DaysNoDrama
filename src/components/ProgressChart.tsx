import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { WEEKS, progress, type Plan } from "@/lib/plans";
import { logKey, type Run } from "@/lib/tracker";

/** Weight progression over the 8 weeks for a single exercise. */
export function ProgressChart({ plan, run }: { plan: Plan; run: Run }) {
  const options = useMemo(
    () =>
      plan.days.flatMap((day, dayIdx) =>
        day.exercises.map((ex, exIdx) => ({
          value: `${dayIdx + 1}:${exIdx}`,
          label: `${day.title} · ${ex.name}`,
          bodyweight: ex.weight === 0,
        })),
      ),
    [plan],
  );

  const [selected, setSelected] = useState(
    options.find((o) => !o.bodyweight)?.value ?? options[0]?.value ?? "1:0",
  );
  const [dayStr, exStr] = selected.split(":");
  const dayNo = Number(dayStr);
  const exIdx = Number(exStr);
  const exercise = plan.days[dayNo - 1]?.exercises[exIdx];

  const data = useMemo(() => {
    if (!exercise) return [];
    return Array.from({ length: WEEKS }, (_, i) => {
      const week = i + 1;
      const logged = run.logs[logKey(week, dayNo, exIdx)];
      return {
        week: `W${week}`,
        target: progress(exercise, week).weight,
        logged: logged ? logged.weight : null,
      };
    });
  }, [exercise, run.logs, dayNo, exIdx]);

  if (!exercise) return null;

  return (
    <div className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Weight progress</h2>
          <p className="text-xs text-muted-foreground">
            Your logged load per week vs. the plan target
          </p>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="max-w-[15rem] rounded-full border border-input bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-sky"
          aria-label="Choose an exercise"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {exercise.weight === 0 && (
        <p className="mt-3 text-xs font-semibold text-pink">
          This one is bodyweight — add a weight in the tracker to see a line here.
        </p>
      )}

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              unit="kg"
              width={58}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
              formatter={(v) => (v === null || v === undefined ? "—" : `${v} kg`)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="var(--sky)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="logged"
              name="You lifted"
              stroke="var(--pink)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--pink)" }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
