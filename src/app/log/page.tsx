"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { toDateString, formatDateLabel, suggestMeal } from "@/lib/date";
import { MEAL_OPTIONS, MEAL_LABELS, MEAL_ICONS, type Food, type Meal } from "@/lib/types";

export default function LogPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <LogPageContent />
    </Suspense>
  );
}

function LogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeUser } = useProfile();
  const [mode, setMode] = useState<"food" | "quick">("food");
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [date, setDate] = useState(
    () => searchParams.get("date") || toDateString()
  );
  const [meal, setMeal] = useState<Meal>(() => suggestMeal());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/foods")
      .then((res) => res.json())
      .then(setFoods);
  }, []);

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((f) => f.name.toLowerCase().includes(q));
  }, [foods, search]);

  function goBackToDashboard() {
    const today = toDateString();
    router.push(date === today ? "/" : `/?date=${date}`);
  }

  async function handleFoodSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeUser) return;
    if (!selectedFood) return setError("Pick a food first.");
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0)
      return setError("Quantity must be a positive number.");

    setSubmitting(true);
    const res = await fetch("/api/log-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: activeUser.id,
        food_id: selectedFood.id,
        quantity: qty,
        date,
        meal,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      return;
    }
    goBackToDashboard();
  }

  async function handleQuickSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeUser) return;
    const kcalNum = Number(kcal);
    const proteinNum = Number(protein);
    if (!Number.isFinite(kcalNum) || kcalNum < 0)
      return setError("Calories must be a non-negative number.");
    if (!Number.isFinite(proteinNum) || proteinNum < 0)
      return setError("Protein must be a non-negative number.");

    setSubmitting(true);
    const res = await fetch("/api/log-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: activeUser.id,
        kcal: kcalNum,
        protein: proteinNum,
        date,
        meal,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      return;
    }
    goBackToDashboard();
  }

  const isToday = date === toDateString();

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm shadow-sm">
        <span className="font-medium text-muted-foreground">
          Logging for{" "}
          <span className="text-foreground">{formatDateLabel(date)}</span>
        </span>
        <span className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            max={toDateString()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(toDateString())}
              className="text-xs font-medium text-accent-soft-foreground hover:underline"
            >
              Today
            </button>
          )}
        </span>
      </label>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <span className="text-xs font-medium text-muted-foreground">Meal</span>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMeal(m)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors ${
                meal === m
                  ? "border-accent bg-accent-soft text-accent-soft-foreground"
                  : "border-border text-muted-foreground hover:bg-surface-muted"
              }`}
            >
              <span className="text-lg leading-none">{MEAL_ICONS[m]}</span>
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 rounded-full bg-surface-muted p-1">
        <button
          onClick={() => setMode("food")}
          className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
            mode === "food"
              ? "bg-surface shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          From food
        </button>
        <button
          onClick={() => setMode("quick")}
          className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
            mode === "quick"
              ? "bg-surface shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Quick log
        </button>
      </div>

      {mode === "food" ? (
        <form
          onSubmit={handleFoodSubmit}
          className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-sm"
        >
          <input
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Search foods…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedFood(null);
            }}
          />

          {!selectedFood ? (
            <ul className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto rounded-xl border border-border">
              {filteredFoods.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">
                  No foods match. Add one on the Foods tab first.
                </li>
              ) : (
                filteredFoods.map((food) => (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFood(food)}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface-muted"
                    >
                      <span className="text-sm font-medium">{food.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {food.kcal_per_portion} kcal · {food.protein_per_portion}
                        g protein / portion
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-accent bg-accent-soft px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedFood.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFood.kcal_per_portion} kcal ·{" "}
                  {selectedFood.protein_per_portion}g protein / portion
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="text-xs font-medium text-accent-soft-foreground hover:underline"
              >
                Change
              </button>
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm">
            Quantity (portions)
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          {selectedFood && Number(quantity) > 0 && (
            <p className="text-xs text-muted-foreground">
              = {Math.round(selectedFood.kcal_per_portion * Number(quantity))}{" "}
              kcal ·{" "}
              {Math.round(selectedFood.protein_per_portion * Number(quantity))}
              g protein
            </p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !selectedFood}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log it"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleQuickSubmit}
          className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-sm"
        >
          <p className="text-xs text-muted-foreground">
            For one-off items not worth saving to your food list.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Calories
              <input
                className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent"
                type="number"
                inputMode="decimal"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="kcal"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Protein (g)
              <input
                className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent"
                type="number"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="grams"
              />
            </label>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log it"}
          </button>
        </form>
      )}
    </div>
  );
}
