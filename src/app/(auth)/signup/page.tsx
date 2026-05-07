import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { getStoreContext } from "@/lib/store/context";
import { getStoreSettings } from "@/lib/store/settings";

export const metadata = { title: "Create account", robots: { index: false } };

export default async function SignupPage() {
  const { user, staff } = await getStoreContext();
  if (user) redirect(staff ? "/admin/dashboard" : "/account");

  const settings = await getStoreSettings();

  return (
    <AuthCard
      brandName={settings.name}
      title="Create your account"
      subtitle="Get started in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
