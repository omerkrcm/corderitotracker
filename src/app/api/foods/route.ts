import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse, requireValidUserId } from "@/lib/api-helpers";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .order("name");

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse("Invalid JSON body");

  const { name, kcal_per_portion, protein_per_portion, created_by } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("name is required");
  }
  if (typeof kcal_per_portion !== "number" || kcal_per_portion < 0) {
    return errorResponse("kcal_per_portion must be a non-negative number");
  }
  if (typeof protein_per_portion !== "number" || protein_per_portion < 0) {
    return errorResponse("protein_per_portion must be a non-negative number");
  }
  if (created_by != null) {
    const check = await requireValidUserId(created_by);
    if (!check.ok) return check.response;
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("foods")
    .insert({
      name: name.trim(),
      kcal_per_portion,
      protein_per_portion,
      created_by: created_by ?? null,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
