import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateStoreForm } from "@/components/onboarding/create-store-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create your store", robots: { index: false } };

export default async function CreateStorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding/create-store");

  // If they already own an active store, send them there.
  const { data: existing } = await supabase
    .from("stores")
    .select("slug")
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) {
    redirect(`/s/${existing.slug}/admin/dashboard`);
  }

  return (
    <main className="container max-w-xl py-20">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
        Set up your store
      </p>
      <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
        Name your gym&apos;s shop
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Pick a short slug — your store will live at{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">
          /s/&lt;slug&gt;
        </code>
        . You can map a custom domain later.
      </p>
      <div className="mt-8">
        <CreateStoreForm />
      </div>
    </main>
  );
}
