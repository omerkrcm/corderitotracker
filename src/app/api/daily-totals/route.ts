import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { errorResponse, requireValidUserId } from "@/lib/api-helpers";
import { resolveEntryTotals, type LogEntry } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/daily-totals?user_id=...&date=YYYY-MM-DD
// Returns that day's summed kcal/protein as a single flat object — built
// for external automations (e.g. an iOS Shortcut syncing to Apple Health)
// that would rather not loop over and sum a list of entries themselves.
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const date = request.nextUrl.searchParams.get("date");

  const check = await requireValidUserId(userId);
  if (!check.ok) return check.response;

  if (!date || !DATE_RE.test(date)) {
    return errorResponse("date is required and must be YYYY-MM-DD");
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("log_entries")
    .select("*, food:foods(*)")
    .eq("user_id", userId)
    .eq("date", date);

  if (error) return errorResponse(error.message, 500);

  const totals = (data as LogEntry[]).reduce(
    (acc, entry) => {
      const { kcal, protein } = resolveEntryTotals(entry);
      return { kcal: acc.kcal + kcal, protein: acc.protein + protein };
    },
    { kcal: 0, protein: 0 }
  );

  return NextResponse.json({
    user_id: userId,
    date,
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein),
  });
}
