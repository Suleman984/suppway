import { cn } from "@/lib/utils/cn";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variant === "destructive" && "border-destructive/40 bg-destructive/10 text-destructive",
        variant === "success" && "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
        variant === "default" && "border-border bg-muted text-foreground",
        className,
      )}
      {...props}
    />
  );
}
