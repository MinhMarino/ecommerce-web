import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover shadow-sm shadow-black/5",
  secondary:
    "bg-subtle text-ink hover:bg-line-strong/40 border border-line",
  outline: "bg-transparent text-ink border border-line hover:border-line-strong hover:bg-subtle",
  ghost: "bg-transparent text-ink hover:bg-subtle",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-lg",
  icon: "h-10 w-10 rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:cursor-not-allowed disabled:opacity-55",
          buttonVariantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

/** Same visual language as Button, but renders a react-router Link (internal navigation). */
export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <Link
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        buttonVariantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  ),
);
ButtonLink.displayName = "ButtonLink";

/** Same visual language as Button, but renders a plain external <a> anchor. */
export interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const ButtonAnchor = forwardRef<HTMLAnchorElement, ButtonAnchorProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        buttonVariantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
);
ButtonAnchor.displayName = "ButtonAnchor";
