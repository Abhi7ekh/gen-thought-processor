import type { User } from "@supabase/supabase-js";

export type ProfileIdentity = {
  displayName: string;
  email: string;
  initials: string;
};

export function getProfileIdentity(user: User): ProfileIdentity {
  const email = user.email ?? "";
  const metadata = user.user_metadata;
  const metadataName = [metadata.full_name, metadata.name, metadata.display_name].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  const displayName = metadataName?.trim() || email.split("@")[0] || "Your profile";
  const nameParts = displayName.trim().split(/\s+/u).filter(Boolean);
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
    : (nameParts[0] ?? "?").slice(0, 2);

  return { displayName, email, initials: initials.toLocaleUpperCase() };
}