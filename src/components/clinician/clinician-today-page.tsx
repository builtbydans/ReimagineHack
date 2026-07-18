import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { ClinicianHeader } from "@/components/clinician/clinician-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clinicianAppointments,
  type ClinicianAppointment,
} from "@/data/clinician-appointments";
import { cn } from "@/lib/utils";

function StandardAppointmentRow({
  appointment,
}: {
  appointment: ClinicianAppointment;
}) {
  const complete = appointment.status === "Completed";
  return (
    <li
      className={cn(
        "grid gap-3 px-5 py-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-6",
        complete && "text-muted-foreground",
      )}
    >
      <time className="text-sm font-semibold tabular-nums">
        {appointment.time}
      </time>
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", !complete && "text-foreground")}>
          {appointment.patientName}
        </p>
        <p className="mt-0.5 text-xs">{appointment.reason}</p>
      </div>
      <span className="flex items-center gap-1.5 text-xs font-medium">
        {complete ? <CheckCircle2 className="size-3.5" /> : <Clock3 className="size-3.5" />}
        {appointment.status}
      </span>
    </li>
  );
}

function NextPatientRow({
  appointment,
}: {
  appointment: ClinicianAppointment;
}) {
  return (
    <li className="relative mx-2 overflow-hidden rounded-2xl bg-plum-950 text-white shadow-card sm:mx-3">
      <div className="absolute inset-y-0 left-0 w-1 bg-sage-300" />
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <div>
          <time className="text-base font-semibold tabular-nums">
            {appointment.time}
          </time>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-sage-200">
            In 6 min
          </p>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-[-.025em]">
              {appointment.patientName}
            </h2>
            <Badge className="border-sage-200/30 bg-sage-200/15 text-sage-100">
              Up next
            </Badge>
          </div>
          <p className="mt-1 text-xs text-white/65">
            Age {appointment.age} · {appointment.condition} · Last GP encounter {appointment.lastEncounter}
          </p>
          <p className="mt-3 text-sm font-semibold text-white">
            {appointment.reason}
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-white/75">
            {appointment.context}
          </p>
        </div>
        <Button asChild className="bg-white text-plum-950 hover:bg-plum-50 sm:justify-self-end">
          <Link href="/clinician/appointment-summary">
            Read pre-appointment summary <ArrowRight />
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function ClinicianTodayPage() {
  const nextPatient = clinicianAppointments.find(
    (appointment) => appointment.status === "Up next",
  );

  return (
    <div className="min-h-dvh bg-[#f4f2ef] text-[#251c21]">
      <ClinicianHeader mode="today" />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-plum-700">
              Good afternoon, Dr Rahman
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
              Today’s appointments
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d MMMM yyyy")}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-x-6 sm:text-right">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[.11em] text-muted-foreground">
                Today
              </dt>
              <dd className="mt-1 text-sm font-semibold">8 appointments</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[.11em] text-muted-foreground">
                Remaining
              </dt>
              <dd className="mt-1 text-sm font-semibold">3 patients</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[.11em] text-muted-foreground">
                Next
              </dt>
              <dd className="mt-1 text-sm font-semibold">In 6 minutes</dd>
            </div>
          </dl>
        </section>

        <section className="mt-7" aria-labelledby="working-list-heading">
          <div className="mb-3 flex items-center justify-between gap-4 px-1">
            <h2 id="working-list-heading" className="text-sm font-semibold">
              Working list
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Stethoscope className="size-3.5" /> Bloomsbury Surgery
            </span>
          </div>
          <ol className="divide-y overflow-hidden rounded-[1.35rem] border bg-white py-3 shadow-card">
            {clinicianAppointments.map((appointment) =>
              appointment.status === "Up next" ? (
                <NextPatientRow key={appointment.time} appointment={appointment} />
              ) : (
                <StandardAppointmentRow key={appointment.time} appointment={appointment} />
              ),
            )}
          </ol>
        </section>

        {nextPatient ? (
          <p className="mt-5 flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-plum-600" /> Thread has prepared Amina’s recorded context before she enters.
          </p>
        ) : null}
      </main>
    </div>
  );
}
