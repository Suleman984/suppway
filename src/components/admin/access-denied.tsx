import Link from "@/lib/store/link";
import { ShieldAlert } from "lucide-react";

interface AccessDeniedProps {
  resource: string;
  permission: string;
  roleName?: string;
}

export function AccessDenied({
  resource,
  permission,
  roleName,
}: AccessDeniedProps) {
  return (
    <div className="container max-w-2xl py-16">
      <div className="rounded-lg border bg-card p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">No access to {resource}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role{roleName ? ` (${roleName})` : ""} is missing the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">{permission}</code>{" "}
          permission, which is required to view this page.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask the store owner to grant it to your role, or switch to a role
          that has it.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-6 inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
