"use client";

import { useEffect, useMemo, useState } from "react";
import {
  toDateString,
  startOfWeek,
  getWeekDates,
  dayAbbrev,
} from "@/lib/date";
import { resolveEntryTotals, type LogEntry } from "@/lib/types";

type DayTotal = { kcal: number; protein: number };

function Bar({
  pct,
  over,
  tone,
}: {
  pct: number;
  over: boolean;
  tone: "accent" | "protein";
}) {
  const fillClass = over ? "bg-warning" : tone === "accent" ? "bg-accent" : "bg-protein";
  return (
    <div className="flex h-14 w-2 items-end overflow-hidden rounded-full bg-surface-muted">
      <div
        className={`w-full rounded-full transition-all ${fillClass}`}
        style={{ height: `${pct}%` }}
      />
    </div>
  );
}

export function WeeklySummary({
  userId,
  targetKcal,
  targetProtein,
}: {
  userId: string;
  targetKcal: number;
  targetProtein: number;
}) {
  const today = toDateString();
  const weekStart = startOfWeek(today);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const [totals, setTotals] = useState<Record<string, DayTotal>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const weekEnd = weekDates[6];
    fetch(
      `/api/log-entries?user_id=${userId}&from=${weekStart}&to=${weekEnd}`
    )
      .then((r) => r.json())
      .then((entries: LogEntry[]) => {
        const grouped: Record<string, DayTotal> = {};
        for (const entry of entries) {
          const { kcal, protein } = resolveEntryTotals(entry);
          const acc = grouped[entry.date] ?? { kcal: 0, protein: 0 };
          acc.kcal += kcal;
          acc.protein += protein;
          grouped[entry.date] = acc;
        }
        setTotals(grouped);
      })
      .finally(() => setLoading(false));
  }, [userId, weekStart, weekDates]);

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">This week</h2>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> Calories
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-protein" /> Protein
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex items-end justify-between gap-1">
          {weekDates.map((date) => {
            const isFuture = date > today;
            const isToday = date === today;
            const total = totals[date] ?? { kcal: 0, protein: 0 };
            const kcalPct = targetKcal > 0
              ? Math.min(100, (total.kcal / targetKcal) * 100)
              : 0;
            const proteinPct = targetProtein > 0
              ? Math.min(100, (total.protein / targetProtein) * 100)
              : 0;

            return (
              <div
                key={date}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl py-1.5 ${
                  isToday ? "bg-accent-soft" : ""
                } ${isFuture ? "opacity-30" : ""}`}
              >
                <div className="flex items-end gap-1">
                  <Bar
                    pct={isFuture ? 0 : kcalPct}
                    over={targetKcal > 0 && total.kcal > targetKcal}
                    tone="accent"
                  />
                  <Bar
                    pct={isFuture ? 0 : proteinPct}
                    over={targetProtein > 0 && total.protein > targetProtein}
                    tone="protein"
                  />
                </div>
                <span
                  className={`text-[11px] ${
                    isToday ? "font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {dayAbbrev(date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
