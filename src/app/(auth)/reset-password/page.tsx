import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getStoreContext } from "@/lib/store/context";
import { getStoreSettings } from "@/lib/store/settings";

export const metadata = { title: "Set a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  const { user } = await getStoreContext();
  if (!user) redirect("/forgot-password");

  const settings = await getStoreSettings();
  return (
    <AuthCard brandName={settings.name} title="Set a new password" subtitle="Pick something memorable.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
