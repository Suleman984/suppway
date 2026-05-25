import Link from "@/lib/store/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getStoreSettings } from "@/lib/store/settings";

export const metadata = { title: "Forgot password", robots: { index: false } };

export default async function ForgotPasswordPage() {
  const settings = await getStoreSettings();
  return (
    <AuthCard
      brandName={settings.name}
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
