import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  brandName: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, subtitle, brandName, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn("mx-auto w-full max-w-sm space-y-6", className)}>
      <div className="text-center">
        <Link href="/" className="inline-block text-lg font-semibold">
          {brandName}
        </Link>
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1.5 pb-4">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
