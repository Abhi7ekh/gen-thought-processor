import { AppHeader } from "@/components/layout/app-header";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";

const accountDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

export default async function ProfilePage() {
  const user = await requireUserSession();
  const profile = getProfileIdentity(user);
  const createdAt = user.created_at
    ? accountDateFormatter.format(new Date(user.created_at))
    : "Unavailable";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <AppHeader profile={profile} />

        <div className="mx-auto max-w-3xl pb-16">
          <section className="border-b border-border py-9 sm:py-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-brand-muted">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Profile</h1>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Manage your account information.
            </p>
          </section>

          <section aria-label="Profile information" className="border-b border-border py-8 sm:py-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <ProfileAvatar initials={profile.initials} className="size-16 text-base sm:size-20" />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-foreground">
                  {profile.displayName}
                </h2>
                <p className="mt-1 truncate text-sm text-ink-soft">{profile.email}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="account-information-heading" className="pt-8 sm:pt-10">
            <h2 id="account-information-heading" className="text-sm font-semibold text-ink-strong">
              Account information
            </h2>
            <dl className="mt-4 divide-y divide-border border-y border-border">
              <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_2fr] sm:gap-6">
                <dt className="text-sm text-ink-muted">Display name</dt>
                <dd className="wrap-break-word text-sm font-medium text-foreground">
                  {profile.displayName}
                </dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_2fr] sm:gap-6">
                <dt className="text-sm text-ink-muted">Email</dt>
                <dd className="break-all text-sm font-medium text-foreground">{profile.email || "Unavailable"}</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_2fr] sm:gap-6">
                <dt className="text-sm text-ink-muted">Account created</dt>
                <dd className="text-sm font-medium text-foreground">{createdAt}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}