import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getServerSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function requireUserSession() {
  const { user } = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const { user } = await getServerSession();

  if (user) {
    redirect("/");
  }
}
