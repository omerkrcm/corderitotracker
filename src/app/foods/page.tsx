"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useProfile } from "@/lib/profile-context";
import type { Food } from "@/lib/types";

export default function FoodsPage() {
  const { activeUser } = useProfile();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/foods")
      .then((res) => res.json())
      .then(setFoods)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const kcalNum = Number(kcal);
    const proteinNum = Number(protein);
    if (!name.trim()) return setError("Name is required.");
    if (!Number.isFinite(kcalNum) || kcalNum < 0)
      return setError("Calories must be a non-negative number.");
    if (!Number.isFinite(proteinNum) || proteinNum < 0)
      return setError("Protein must be a non-negative number.");

    setSubmitting(true);
    const res = await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        kcal_per_portion: kcalNum,
        protein_per_portion: proteinNum,
        created_by: activeUser?.id ?? null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      return;
    }

    setName("");
    setKcal("");
    setProtein("");
    setShowForm(false);
    load();
  }

  async function deleteFood(id: string) {
    if (!confirm("Delete this food?")) return;
    const res = await fetch(`/api/foods/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Couldn't delete this food.");
      return;
    }
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-black/50">
          Foods ({foods.length})
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white"
        >
          {showForm ? "Cancel" : "+ New food"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              className="rounded-lg border border-black/15 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anne's kısır (1 portion)"
              autoFocus
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              kcal / portion
              <input
                className="rounded-lg border border-black/15 px-3 py-2"
                type="number"
                inputMode="decimal"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="300"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              protein (g) / portion
              <input
                className="rounded-lg border border-black/15 px-3 py-2"
                type="number"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="10"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save food"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-black/40">Loading…</p>
      ) : foods.length === 0 ? (
        <p className="text-sm text-black/40">
          No foods yet. Add one above — you&apos;ll be able to log it at any
          quantity later.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/5 rounded-2xl border border-black/10 bg-white">
          {foods.map((food) => (
            <li
              key={food.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{food.name}</p>
                <p className="text-xs text-black/40">
                  {food.kcal_per_portion} kcal · {food.protein_per_portion}g
                  protein / portion
                </p>
              </div>
              <button
                onClick={() => deleteFood(food.id)}
                className="shrink-0 rounded-full px-2 py-1 text-xs text-black/40 hover:bg-black/5 hover:text-red-600"
                aria-label={`Delete ${food.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
