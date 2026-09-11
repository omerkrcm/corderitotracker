export type User = {
  id: string;
  name: string;
  created_at: string;
};

export type Food = {
  id: string;
  name: string;
  kcal_per_portion: number;
  protein_per_portion: number;
  created_by: string | null;
  created_at: string;
};

export type LogEntry = {
  id: string;
  user_id: string;
  food_id: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  quantity: number | null;
  kcal: number | null;
  protein: number | null;
  created_at: string;
  // Populated by API when food_id is set, so the client never has to
  // re-fetch the food to display/compute totals.
  food?: Food | null;
};

export type WeightLog = {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  created_at: string;
};

export type Target = {
  user_id: string;
  target_kcal: number;
  target_protein: number;
  updated_at: string;
};

/** Resolved kcal/protein for a log entry, whether food-based or quick-logged. */
export function resolveEntryTotals(entry: LogEntry): {
  kcal: number;
  protein: number;
} {
  if (entry.food_id && entry.food && entry.quantity != null) {
    return {
      kcal: entry.food.kcal_per_portion * entry.quantity,
      protein: entry.food.protein_per_portion * entry.quantity,
    };
  }
  return { kcal: entry.kcal ?? 0, protein: entry.protein ?? 0 };
}
