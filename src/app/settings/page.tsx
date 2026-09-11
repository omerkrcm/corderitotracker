"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useProfile } from "@/lib/profile-context";
import type { Target } from "@/lib/types";

export default function SettingsPage() {
  const { activeUser } = useProfile();
  const [targetKcal, setTargetKcal] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeUser) return;
    fetch(`/api/targets?user_id=${activeUser.id}`)
      .then((res) => res.json())
      .then((data: Target) => {
        setTargetKcal(String(data.target_kcal));
        setTargetProtein(String(data.target_protein));
        setSaved(false);
      })
      .finally(() => setLoading(false));
  }, [activeUser]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!activeUser) return;

    const kcalNum = Number(targetKcal);
    const proteinNum = Number(targetProtein);
    if (!Number.isFinite(kcalNum) || kcalNum < 0)
      return setError("Target calories must be a non-negative number.");
    if (!Number.isFinite(proteinNum) || proteinNum < 0)
      return setError("Target protein must be a non-negative number.");

    setSubmitting(true);
    const res = await fetch("/api/targets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: activeUser.id,
        target_kcal: kcalNum,
        target_protein: proteinNum,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      return;
    }
    setSaved(true);
  }

  async function copyUserId() {
    if (!activeUser) return;
    await navigator.clipboard.writeText(activeUser.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!activeUser || loading) {
    return <p className="text-sm text-black/40">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-black/50">
          Daily targets · {activeUser.name}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            Target calories
            <input
              className="rounded-lg border border-black/15 px-3 py-2"
              type="number"
              inputMode="decimal"
              value={targetKcal}
              onChange={(e) => setTargetKcal(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Target protein (g)
            <input
              className="rounded-lg border border-black/15 px-3 py-2"
              type="number"
              inputMode="decimal"
              value={targetProtein}
              onChange={(e) => setTargetProtein(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved.</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save targets"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-black/50">
          iOS Shortcuts user ID
        </h2>
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="mb-2 text-xs text-black/40">
            Hardcode this ID into a personal Shortcut so it always logs to{" "}
            {activeUser.name}, regardless of which profile is active in the
            app. Send a POST to <code>/api/log-entries</code> or{" "}
            <code>/api/weight</code> with this as <code>user_id</code> in the
            JSON body.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-black/5 px-3 py-2 text-xs">
              {activeUser.id}
            </code>
            <button
              onClick={copyUserId}
              className="shrink-0 rounded-lg border border-black/15 px-3 py-2 text-xs font-medium"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
