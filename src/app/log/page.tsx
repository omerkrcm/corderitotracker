"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import type { Food } from "@/lib/types";

export default function LogPage() {
  const router = useRouter();
  const { activeUser } = useProfile();
  const [mode, setMode] = useState<"food" | "quick">("food");
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
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
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      return;
    }
    router.push("/");
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
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-full bg-black/5 p-1">
        <button
          onClick={() => setMode("food")}
          className={`flex-1 rounded-full py-1.5 text-sm font-medium ${
            mode === "food" ? "bg-white shadow-sm" : "text-black/50"
          }`}
        >
          From food
        </button>
        <button
          onClick={() => setMode("quick")}
          className={`flex-1 rounded-full py-1.5 text-sm font-medium ${
            mode === "quick" ? "bg-white shadow-sm" : "text-black/50"
          }`}
        >
          Quick log
        </button>
      </div>

      {mode === "food" ? (
        <form
          onSubmit={handleFoodSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4"
        >
          <input
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            placeholder="Search foods…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedFood(null);
            }}
          />

          {!selectedFood ? (
            <ul className="flex max-h-64 flex-col divide-y divide-black/5 overflow-y-auto rounded-lg border border-black/10">
              {filteredFoods.length === 0 ? (
                <li className="px-3 py-3 text-sm text-black/40">
                  No foods match. Add one on the Foods tab first.
                </li>
              ) : (
                filteredFoods.map((food) => (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFood(food)}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-black/5"
                    >
                      <span className="text-sm font-medium">{food.name}</span>
                      <span className="text-xs text-black/40">
                        {food.kcal_per_portion} kcal · {food.protein_per_portion}
                        g protein / portion
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-black/10 bg-black/5 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedFood.name}</p>
                <p className="text-xs text-black/40">
                  {selectedFood.kcal_per_portion} kcal ·{" "}
                  {selectedFood.protein_per_portion}g protein / portion
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="text-xs text-black/40 hover:text-black"
              >
                Change
              </button>
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm">
            Quantity (portions)
            <input
              className="rounded-lg border border-black/15 px-3 py-2"
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          {selectedFood && Number(quantity) > 0 && (
            <p className="text-xs text-black/40">
              = {Math.round(selectedFood.kcal_per_portion * Number(quantity))}{" "}
              kcal ·{" "}
              {Math.round(selectedFood.protein_per_portion * Number(quantity))}
              g protein
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !selectedFood}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log it"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleQuickSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4"
        >
          <p className="text-xs text-black/40">
            For one-off items not worth saving to your food list.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Calories
              <input
                className="rounded-lg border border-black/15 px-3 py-2"
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
                className="rounded-lg border border-black/15 px-3 py-2"
                type="number"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="grams"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log it"}
          </button>
        </form>
      )}
    </div>
  );
}
