import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse } from "@/lib/api-helpers";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/weight/[id]">
) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ ok: true });
}
