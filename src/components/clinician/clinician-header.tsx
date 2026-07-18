import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { ThreadLogo } from "@/components/shared/thread-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type ClinicianMode = "today" | "summary" | "investigation";

const tabs = [
  { label: "Today", href: "/clinician", value: "today" },
  {
    label: "Appointment Summary",
    href: "/clinician/appointment-summary",
    value: "summary",
  },
  {
    label: "Clinical Investigation",
    href: "/clinician/investigation",
    value: "investigation",
  },
] as const;

function ModeNavigation({ mode }: { mode: ClinicianMode }) {
  return (
    <nav
      aria-label="Clinician view"
      className="order-3 flex w-full gap-1 self-stretch sm:order-none sm:ml-5 sm:w-auto"
    >
      {tabs.map((tab) => {
        const active = tab.value === mode;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-11 flex-1 items-center justify-center px-2 text-[11px] font-semibold text-muted-foreground transition-colors sm:h-full sm:flex-none sm:px-4 sm:text-xs",
              active && "text-plum-800",
              !active && "hover:text-foreground",
            )}
          >
            {tab.label}
            {active ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-plum-700" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function ClinicianHeader({ mode }: { mode: ClinicianMode }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1500px] flex-wrap items-center gap-x-4 px-4 sm:flex-nowrap sm:px-6 lg:px-8">
        <ThreadLogo href="/clinician" />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <ModeNavigation mode={mode} />
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/patient">
              <ArrowLeftRight /> Patient view
            </Link>
          </Button>
          <Avatar className="size-8">
            <AvatarFallback className="bg-sage-100 text-xs text-sage-700">
              DR
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

