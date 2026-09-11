import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse, requireValidUserId } from "@/lib/api-helpers";

// GET /api/weight?user_id=...
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const check = await requireValidUserId(userId);
  if (!check.ok) return check.response;

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data);
}

// POST /api/weight — also usable from an iOS Shortcut with a hardcoded user_id.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse("Invalid JSON body");

  const { user_id, weight, date } = body;

  const check = await requireValidUserId(user_id);
  if (!check.ok) return check.response;

  if (typeof weight !== "number" || weight <= 0) {
    return errorResponse("weight must be a positive number");
  }

  const resolvedDate =
    typeof date === "string" && date.length > 0
      ? date
      : new Date().toISOString().slice(0, 10);

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({ user_id, weight, date: resolvedDate })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
