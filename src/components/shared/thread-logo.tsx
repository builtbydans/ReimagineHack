import Link from "next/link";
import { cn } from "@/lib/utils";

export function ThreadMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-8 items-center justify-center", className)} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" className="size-full">
        <path d="M7 10.5C10 6 16.5 6 18 12.2C19.5 18.5 25.5 19 29 14" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
        <path d="M7 22C10.5 17.5 16.5 17 18 23.2C19.5 29.5 25.5 29 29 24.5" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
        <circle cx="7" cy="10.5" r="2.2" fill="currentColor" />
        <circle cx="29" cy="24.5" r="2.2" fill="currentColor" />
      </svg>
    </span>
  );
}

export function ThreadLogo({ href = "/", inverse = false, className }: { href?: string; inverse?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-[-.035em]", inverse ? "text-white" : "text-plum-950", className)}>
      <ThreadMark className={inverse ? "text-plum-200" : "text-plum-600"} />
      <span className="text-[1.35rem]">Thread</span>
    </Link>
  );
}
