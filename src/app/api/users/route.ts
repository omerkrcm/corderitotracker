import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("name");

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data);
}
