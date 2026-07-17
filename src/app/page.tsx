import Link from "next/link";
import { ArrowUpRight, HeartPulse, Stethoscope } from "lucide-react";
import { ThreadLogo, ThreadMark } from "@/components/shared/thread-logo";
import { Badge } from "@/components/ui/badge";

const destinations = [
  {
    href: "/patient",
    label: "Enter patient view",
    eyebrow: "For Amina",
    description: "Add what happened between appointments and see it become part of one continuous story.",
    icon: HeartPulse,
    className: "bg-plum-950 text-white border-plum-900",
  },
  {
    href: "/clinician",
    label: "Enter clinician view",
    eyebrow: "For care teams",
    description: "Understand what changed, what matters to the patient, and the evidence behind every observation.",
    icon: Stethoscope,
    className: "bg-[#f7f1ed] text-plum-950 border-[#eaded8]",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f7f4ef]">
      <div className="pointer-events-none absolute inset-0 thread-grid opacity-70" />
      <div className="pointer-events-none absolute -left-28 top-32 size-[28rem] rounded-full bg-plum-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[30rem] rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <header className="flex items-center justify-between">
          <ThreadLogo />
          <Badge variant="outline" className="hidden bg-white/70 sm:inline-flex">Synthetic product demo</Badge>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-20 lg:py-10">
          <div className="max-w-2xl animate-fade-up">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-plum-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-plum-700 shadow-sm">
              <span className="size-1.5 rounded-full bg-sage-500" />
              Context for chronic care
            </div>
            <h1 className="text-balance text-[clamp(3.4rem,8vw,6.75rem)] font-semibold leading-[.9] tracking-[-.075em] text-plum-950">
              One health story.<span className="block text-plum-600">Every encounter.</span>
            </h1>
            <p className="mt-7 max-w-xl text-balance text-base leading-7 text-[#675b62] sm:text-lg sm:leading-8">
              Thread connects patient updates, healthcare encounters and important changes into one evidence-backed longitudinal story.
            </p>
            <p className="mt-5 max-w-lg border-l-2 border-plum-300 pl-4 text-sm leading-6 text-plum-800">
              Healthcare only sees snapshots. Chronic illness is a continuous story. Thread connects the moments in between.
            </p>
          </div>

          <div className="grid gap-4 lg:justify-self-end lg:max-w-[34rem]">
            {destinations.map((destination, index) => {
              const Icon = destination.icon;
              return (
                <Link
                  key={destination.href}
                  href={destination.href}
                  className={`group relative overflow-hidden rounded-[1.75rem] border p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_rgba(58,38,49,.4)] sm:p-7 ${destination.className}`}
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <div className="flex items-start justify-between gap-5">
                    <span className={`flex size-11 items-center justify-center rounded-2xl ${index === 0 ? "bg-white/10 text-plum-100" : "bg-white text-plum-600"}`}>
                      <Icon className="size-5" />
                    </span>
                    <span className={`flex size-10 items-center justify-center rounded-full transition-transform group-hover:rotate-45 ${index === 0 ? "bg-white text-plum-900" : "bg-plum-950 text-white"}`}>
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                  <p className={`mt-8 text-xs font-semibold uppercase tracking-[.16em] ${index === 0 ? "text-plum-200" : "text-plum-500"}`}>{destination.eyebrow}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{destination.label}</h2>
                  <p className={`mt-3 max-w-md text-sm leading-6 ${index === 0 ? "text-plum-100/75" : "text-[#71646b]"}`}>{destination.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-plum-900/10 pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Synthetic hackathon demonstration. Not for clinical use.</p>
          <p className="inline-flex items-center gap-2"><ThreadMark className="size-4 text-plum-400" /> Every appointment starts with context, not reconstruction.</p>
        </footer>
      </div>
    </main>
  );
}
