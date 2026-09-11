import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse } from "@/lib/api-helpers";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/foods/[id]">
) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const { error } = await supabase.from("foods").delete().eq("id", id);

  if (error) {
    // Postgres foreign key violation: this food has been logged before.
    if (error.code === "23503") {
      return errorResponse(
        "This food has log entries and can't be deleted. Delete those entries first if you really want to remove it.",
        409
      );
    }
    return errorResponse(error.message, 500);
  }
  return NextResponse.json({ ok: true });
}
