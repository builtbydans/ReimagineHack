-- Thread V1 database schema.
--
-- This schema is intentionally lightweight for the synthetic hackathon demo. Before
-- production use, enable row-level security and add policies, tenant isolation,
-- consent/audit controls, retention rules, encryption/key management, and the wider
-- clinical-information governance required for health data.

begin;

create extension if not exists pgcrypto;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date_of_birth date,
  condition text,
  preferred_language text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'patient_text',
      'patient_voice',
      'medication_update',
      'ae_encounter',
      'gp_review',
      'specialist_review',
      'test_result',
      'referral',
      'ai_observation'
    )
  ),
  title text not null,
  summary text,
  recorded_at timestamptz not null,
  source_kind text not null check (
    source_kind in (
      'patient_reported',
      'imported_clinical_record',
      'ai_organised'
    )
  ),
  organisation text,
  location text,
  language text,
  original_text text,
  translated_text text,
  audio_url text,
  severity integer check (severity between 0 and 10),
  structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_references (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.timeline_events(id) on delete cascade,
  supporting_event_id uuid not null references public.timeline_events(id) on delete cascade,
  source_kind text not null check (
    source_kind in (
      'patient_reported',
      'imported_clinical_record',
      'ai_organised'
    )
  ),
  label text not null,
  excerpt text not null,
  original_excerpt text,
  translated_excerpt text,
  field text,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint evidence_reference_is_not_self check (event_id <> supporting_event_id)
);

create table if not exists public.appointment_briefs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_date timestamptz not null,
  status text not null default 'draft' check (
    status in ('draft', 'ready', 'shared', 'archived')
  ),
  patient_priorities jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.imported_encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  timeline_event_id uuid unique references public.timeline_events(id) on delete set null,
  provider text not null,
  encounter_type text not null,
  encounter_date timestamptz not null,
  source_reference text not null unique,
  raw_payload jsonb not null default '{}'::jsonb,
  structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists timeline_events_patient_recorded_at_idx
  on public.timeline_events (patient_id, recorded_at desc);

create index if not exists timeline_events_event_type_idx
  on public.timeline_events (event_type);

create index if not exists timeline_events_source_kind_idx
  on public.timeline_events (source_kind);

create index if not exists evidence_references_event_id_idx
  on public.evidence_references (event_id);

create index if not exists evidence_references_supporting_event_id_idx
  on public.evidence_references (supporting_event_id);

create index if not exists appointment_briefs_patient_date_idx
  on public.appointment_briefs (patient_id, appointment_date desc);

create index if not exists imported_encounters_patient_date_idx
  on public.imported_encounters (patient_id, encounter_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists timeline_events_set_updated_at on public.timeline_events;
create trigger timeline_events_set_updated_at
before update on public.timeline_events
for each row execute function public.set_updated_at();

drop trigger if exists appointment_briefs_set_updated_at on public.appointment_briefs;
create trigger appointment_briefs_set_updated_at
before update on public.appointment_briefs
for each row execute function public.set_updated_at();

comment on table public.patients is
  'Synthetic demo patient records. Production requires full access control and health-data governance.';
comment on table public.timeline_events is
  'Longitudinal patient, encounter, and AI-organised events. Production requires RLS and audit controls.';
comment on table public.evidence_references is
  'Traceable links from an AI-organised event to source events; these links do not imply clinical verification.';
comment on table public.appointment_briefs is
  'Patient-reviewed appointment context. It is not a diagnosis or treatment recommendation.';
comment on table public.imported_encounters is
  'Imported encounter payloads. The V1 seed contains synthetic demonstration data only.';

commit;
