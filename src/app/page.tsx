"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useProfile } from "@/lib/profile-context";
import { toDateString, formatTime } from "@/lib/date";
import { resolveEntryTotals, type LogEntry, type Target } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { getUserColorClass, getInitial } from "@/lib/user-color";

export default function DashboardPage() {
  const { activeUser, loading: profileLoading } = useProfile();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = toDateString();

  const load = useCallback(() => {
    if (!activeUser) return;
    Promise.all([
      fetch(`/api/log-entries?user_id=${activeUser.id}&date=${today}`).then((r) =>
        r.json()
      ),
      fetch(`/api/targets?user_id=${activeUser.id}`).then((r) => r.json()),
    ]).then(([entriesData, targetData]) => {
      setEntries(entriesData);
      setTarget(targetData);
      setLoading(false);
    });
  }, [activeUser, today]);

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
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${getUserColorClass(
              activeUser.id
            )}`}
          >
            {getInitial(activeUser.name)}
          </span>
          Today · {activeUser.name}
        </h2>
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
          href="/log"
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

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Today&apos;s entries
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing logged yet today.
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
