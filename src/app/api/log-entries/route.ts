import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse, requireValidUserId } from "@/lib/api-helpers";

// GET /api/log-entries?user_id=...&date=YYYY-MM-DD (date optional)
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const date = request.nextUrl.searchParams.get("date");

  const check = await requireValidUserId(userId);
  if (!check.ok) return check.response;

  const supabase = supabaseServer();
  let query = supabase
    .from("log_entries")
    .select("*, food:foods(*)")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (date) query = query.eq("date", date);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data);
}

// POST /api/log-entries
// Used by both the in-app logging UI and personal iOS Shortcuts (which
// hardcode user_id, bypassing the profile picker entirely).
//
// Body shape is either:
//   { user_id, food_id, quantity, date?, time? }
// or a quick log:
//   { user_id, kcal, protein, date?, time? }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse("Invalid JSON body");

  const { user_id, food_id, quantity, kcal, protein, date, time } = body;

  const userCheck = await requireValidUserId(user_id);
  if (!userCheck.ok) return userCheck.response;

  const now = new Date();
  const resolvedDate =
    typeof date === "string" && date.length > 0
      ? date
      : now.toISOString().slice(0, 10);
  const resolvedTime =
    typeof time === "string" && time.length > 0
      ? time
      : now.toISOString().slice(11, 19);

  const supabase = supabaseServer();

  const row: Record<string, unknown> = {
    user_id,
    date: resolvedDate,
    time: resolvedTime,
  };

  if (food_id != null) {
    if (typeof food_id !== "string") return errorResponse("food_id must be a string");
    if (typeof quantity !== "number" || quantity <= 0) {
      return errorResponse("quantity must be a positive number when logging a food");
    }
    const { data: food, error: foodError } = await supabase
      .from("foods")
      .select("id")
      .eq("id", food_id)
      .maybeSingle();
    if (foodError) return errorResponse(foodError.message, 500);
    if (!food) return errorResponse("Unknown food_id", 404);

    row.food_id = food_id;
    row.quantity = quantity;
  } else {
    if (typeof kcal !== "number" || kcal < 0) {
      return errorResponse("kcal must be a non-negative number for a quick log entry");
    }
    if (typeof protein !== "number" || protein < 0) {
      return errorResponse("protein must be a non-negative number for a quick log entry");
    }
    row.kcal = kcal;
    row.protein = protein;
  }

  const { data, error } = await supabase
    .from("log_entries")
    .insert(row)
    .select("*, food:foods(*)")
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
