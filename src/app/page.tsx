"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { toDateString, addDays, formatDateLabel, formatTime } from "@/lib/date";
import { resolveEntryTotals, type LogEntry, type Target } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { WeeklySummary } from "@/components/WeeklySummary";
import { getUserColorClass, getInitial } from "@/lib/user-color";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { activeUser, loading: profileLoading } = useProfile();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(
    () => searchParams.get("date") || toDateString()
  );
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isToday = selectedDate === toDateString();

  const load = useCallback(() => {
    if (!activeUser) return;
    Promise.all([
      fetch(
        `/api/log-entries?user_id=${activeUser.id}&date=${selectedDate}`
      ).then((r) => r.json()),
      fetch(`/api/targets?user_id=${activeUser.id}`).then((r) => r.json()),
    ]).then(([entriesData, targetData]) => {
      setEntries(entriesData);
      setTarget(targetData);
      setLoading(false);
    });
  }, [activeUser, selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteEntry(id: string) {
    setDeletingId(id);
    await fetch(`/api/log-entries/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  if (profileLoading || !activeUser) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const totals = entries.reduce(
    (acc, e) => {
      const { kcal, protein } = resolveEntryTotals(e);
      return { kcal: acc.kcal + kcal, protein: acc.protein + protein };
    },
    { kcal: 0, protein: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-muted-foreground hover:bg-surface-muted"
            aria-label="Previous day"
          >
            ‹
          </button>
          <h2 className="flex min-w-0 items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${getUserColorClass(
                activeUser.id
              )}`}
            >
              {getInitial(activeUser.name)}
            </span>
            <span className="truncate">
              {formatDateLabel(selectedDate)} · {activeUser.name}
            </span>
          </h2>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            disabled={isToday}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-muted-foreground hover:bg-surface-muted disabled:opacity-20"
            aria-label="Next day"
          >
            ›
          </button>
        </div>
        <ProgressBar
          label="Calories"
          value={totals.kcal}
          target={target?.target_kcal ?? 0}
          unit="kcal"
          tone="accent"
        />
        <ProgressBar
          label="Protein"
          value={totals.protein}
          target={target?.target_protein ?? 0}
          unit="g"
          tone="protein"
        />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/log?date=${selectedDate}`}
          className="rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
        >
          + Log food
        </Link>
        <Link
          href="/weight"
          className="rounded-2xl border border-border bg-surface px-4 py-3 text-center text-sm font-semibold shadow-sm"
        >
          ⚖️ Log weight
        </Link>
      </div>

      {!loading && target && (
        <WeeklySummary
          userId={activeUser.id}
          targetKcal={target.target_kcal}
          targetProtein={target.target_protein}
        />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Entries</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isToday
              ? "Nothing logged yet today."
              : `Nothing logged on ${formatDateLabel(selectedDate)}.`}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-surface shadow-sm">
            {entries.map((entry) => {
              const { kcal, protein } = resolveEntryTotals(entry);
              const name = entry.food?.name ?? "Quick log";
              return (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {name}
                      {entry.quantity != null && entry.quantity !== 1 && (
                        <span className="text-muted-foreground">
                          {" "}
                          ×{entry.quantity}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(entry.time)} · {Math.round(kcal)} kcal ·{" "}
                      {Math.round(protein)}g protein
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    disabled={deletingId === entry.id}
                    className="shrink-0 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-surface-muted hover:text-danger"
                    aria-label={`Delete ${name}`}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
