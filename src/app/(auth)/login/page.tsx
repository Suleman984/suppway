import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert } from "@/components/ui/alert";
import { getStoreContext } from "@/lib/store/context";
import { getStoreSettings } from "@/lib/store/settings";

export const metadata = { title: "Sign in", robots: { index: false } };

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const { user, staff } = await getStoreContext();
  if (user) redirect(staff ? "/admin/dashboard" : "/account");

  const settings = await getStoreSettings();

  return (
    <AuthCard
      brandName={settings.name}
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          {decodeURIComponent(error)}
        </Alert>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
