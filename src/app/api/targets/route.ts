import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse, requireValidUserId } from "@/lib/api-helpers";

// GET /api/targets?user_id=...
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const check = await requireValidUserId(userId);
  if (!check.ok) return check.response;

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("targets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(
    data ?? { user_id: userId, target_kcal: 2000, target_protein: 100 }
  );
}

// PUT /api/targets — upsert the caller's targets.
export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse("Invalid JSON body");

  const { user_id, target_kcal, target_protein } = body;

  const check = await requireValidUserId(user_id);
  if (!check.ok) return check.response;

  if (typeof target_kcal !== "number" || target_kcal < 0) {
    return errorResponse("target_kcal must be a non-negative number");
  }
  if (typeof target_protein !== "number" || target_protein < 0) {
    return errorResponse("target_protein must be a non-negative number");
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("targets")
    .upsert(
      { user_id, target_kcal, target_protein, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data);
}
