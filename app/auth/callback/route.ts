import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callbackQuerySchema } from "@/lib/validations/auth";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const parsed = callbackQuerySchema.safeParse({
    code: requestUrl.searchParams.get("code"),
    next: requestUrl.searchParams.get("next") ?? "/",
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { code, next } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth.callback] exchangeCodeForSession failed");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
