"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium " +
  "transition-[transform,box-shadow,background-color,color,border-color,opacity] duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ink)] text-[var(--paper)] shadow-[0_10px_30px_rgba(16,19,23,0.18)] " +
    "hover:bg-[color:rgba(16,19,23,0.92)]",
  secondary:
    "border border-[var(--stroke)] bg-[var(--paper)] text-[var(--ink)] " +
    "hover:bg-[var(--wash)]",
  ghost:
    "text-[var(--ink)] hover:bg-[var(--wash)] border border-transparent hover:border-[var(--stroke)]",
  danger:
    "bg-[#db2b39] text-white shadow-[0_10px_30px_rgba(219,43,57,0.24)] hover:bg-[#c42430]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

