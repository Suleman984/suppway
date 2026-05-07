import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Label } from "./label";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
