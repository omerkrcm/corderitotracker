"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useProfile } from "@/lib/profile-context";
import { toDateString, formatDateLabel } from "@/lib/date";
import { getUserColorVar } from "@/lib/user-color";
import { WeightChart } from "@/components/WeightChart";
import type { WeightLog } from "@/lib/types";

export default function WeightPage() {
  const { activeUser } = useProfile();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(toDateString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!activeUser) return;
    fetch(`/api/weight?user_id=${activeUser.id}`)
      .then((res) => res.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeUser]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeUser) return;

    const weightNum = Number(weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0)
      return setError("Weight must be a positive number.");

    setSubmitting(true);
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: activeUser.id, weight: weightNum, date }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      return;
    }
    setWeight("");
    load();
  }

  async function deleteLog(id: string) {
    await fetch(`/api/weight/${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  if (!activeUser) return null;

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Weight
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent"
              type="number"
              inputMode="decimal"
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 78.4"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Date
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Log weight"}
        </button>
      </form>

      {!loading && logs.length > 0 && (
        <WeightChart logs={logs} color={getUserColorVar(activeUser.id)} />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">History</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No weight logged yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-surface shadow-sm">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{log.weight}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateLabel(log.date)}
                  </p>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="shrink-0 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-surface-muted hover:text-danger"
                  aria-label="Delete entry"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
