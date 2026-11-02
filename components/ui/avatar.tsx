/* eslint-disable @next/next/no-img-element */

import { cn, getInitials } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
};

const sizeStyles = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-24 w-24 text-2xl",
};

export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
}: AvatarProps) {
  const name = `${firstName} ${lastName}`.trim();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 font-semibold text-brand-700 ring-1 ring-inset ring-brand-100",
        sizeStyles[size],
        className
      )}
      aria-label={name || "Profile photo"}
    >
      {src ? (
        <img
          src={src}
          alt={name ? `${name} profile photo` : "Profile photo"}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden="true">
          {firstName || lastName ? getInitials(firstName, lastName) : "?"}
        </span>
      )}
    </span>
  );
}
