import { logout } from "@/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent"
      >
        Log out
      </button>
    </form>
  );
}
