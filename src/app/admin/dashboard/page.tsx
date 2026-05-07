import { getStoreContext } from "@/lib/store/context";
import { getStoreSettings } from "@/lib/store/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile } = await getStoreContext();
  const settings = await getStoreSettings();
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">
        Welcome back{profile?.fullName ? `, ${profile.fullName}` : ""}
      </h1>
      <p className="mt-2 text-muted-foreground">
        You&apos;re signed in to <strong>{settings.name}</strong>. Build dashboard widgets here:
        revenue, recent orders, low-stock alerts, funnel conversion.
      </p>
    </div>
  );
}
