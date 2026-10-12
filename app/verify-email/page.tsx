import { VerifyEmailCard } from "@/components/auth/verify-email-card";

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <VerifyEmailCard email={email} />
    </main>
  );
}
