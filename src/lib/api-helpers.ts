import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Every write endpoint (in-app and iOS Shortcuts alike) must pass a real
 * `user_id`. This is the app's entire authorization model in place of a
 * login system: reject anything with a missing or unknown user_id.
 */
export async function requireValidUserId(
  userId: unknown
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (typeof userId !== "string" || userId.length === 0) {
    return { ok: false, response: errorResponse("user_id is required", 400) };
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, response: errorResponse(error.message, 500) };
  }
  if (!data) {
    return { ok: false, response: errorResponse("Unknown user_id", 401) };
  }
  return { ok: true };
}
