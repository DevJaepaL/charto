import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md";
  withBadge?: boolean;
}

export function BrandLogo({
  href = "/",
  size = "md",
  withBadge = true,
}: BrandLogoProps) {
  const isSmall = size === "sm";

  return (
    <Link
      aria-label="Charto 홈"
      className="group inline-flex items-center gap-3"
      href={href}
    >
      {withBadge ? (
        <span
          className={`brand-badge inline-flex items-center justify-center rounded-full font-black uppercase tracking-[0.24em] ${
            isSmall ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
          }`}
        >
          CH
        </span>
      ) : null}
      <span
        className={`font-black uppercase leading-none tracking-[-0.08em] text-[var(--brand-strong)] transition-transform group-hover:-translate-y-0.5 ${
          isSmall ? "text-xl" : "text-2xl md:text-[1.75rem]"
        }`}
      >
        CHARTO
      </span>
    </Link>
  );
}
