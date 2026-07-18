# Threads

> Healthcare only sees snapshots. Chronic illness is a continuous story. Threads connects the moments in between.

Threads is an always-on health context platform for people living with chronic conditions. It connects patient updates, healthcare encounters, medication changes, results, and evidence-linked AI-organised observations into one longitudinal story.

The V1 demo follows **Amina Khan**, a 32-year-old woman living with endometriosis. Every person, encounter, observation, result, and quote in this repository is synthetic.

Threads is not an AI doctor. It does not diagnose, recommend treatment, provide clinical certainty, or monitor emergencies. Its purpose is to preserve the patient’s voice, organise fragmented context, and help every appointment begin with context instead of reconstruction.

## The problem

Chronic illness is continuous, while healthcare encounters are episodic. Important details are often distributed across memory, written notes, voice updates, GP reviews, emergency visits, prescriptions, referrals, and test results. Patients repeatedly reconstruct their history, and clinicians often begin appointments without the story between encounters.

Threads brings those moments together while keeping three source classes visibly separate:

- **Patient-reported:** written updates, voice updates, symptoms, functional impact, and medication concerns.
- **Imported clinical record:** synthetic encounter notes, observations, results, prescriptions, and referrals.
- **AI-organised:** evidence-linked patterns and summaries that are always labelled as not clinically verified.

## Product proposition

**Healthcare only sees snapshots. Chronic illness is a continuous story. Threads connects the moments in between.**

Every appointment should start with context, not reconstruction.

## What is included

### Patient experience

- Calm, mobile-first home at `/patient` with a current Threads observation, next appointment, recent story, and multiple update methods.
- Full filterable timeline at `/patient/timeline`, including a clearly labelled patient-reported pain trend.
- Written and browser `MediaRecorder` update flow at `/patient/update` with processing states, structured review, and local persistence.
- Appointment preparation at `/patient/prepare` with selectable priorities, an evidence-linked brief, ready state, and demo share/export result.
- Reusable evidence and UCLH encounter drawers with original/translated source text and synthetic record metadata.

### Clinician experience

- Desktop-first overview at `/clinician` showing what changed, current concerns, patient priorities, medication context, functional impact, symptom trend, patient voice, encounter history, and longitudinal timeline.
- Evidence counts open the exact source sentences or imported record fields behind each AI-organised statement.
- A polished simulated external encounter-import flow that is explicitly labelled as a demonstration and does not claim NHS connectivity.

### Data and server architecture

- 15 seeded timeline events covering April–July 2026.
- Stable evidence references connecting observations and appointment brief items to their sources.
- Supabase-aware repositories with deterministic fallback data.
- Browser local storage for newly added demo updates when Supabase is not configured.
- Zod-validated route handlers for patient updates, transcription, encounter import, and appointment briefs.
- Server-only Gemini and Runware service seams with safe fallback behaviour.

## Demo flow

1. Open the patient home.
2. Show the current “What Threads has noticed” observation.
3. Add a written or voice update.
4. Review the organised details and show the update joining the timeline.
5. Open the synthetic UCLH A&E encounter.
6. Prepare for the upcoming gynaecology appointment.
7. Switch to the clinician view.
8. Show the combined patient-reported and imported encounter context.
9. Open the evidence behind an observation.
10. Explain that every appointment starts with context instead of reconstruction.

## Technical stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS and customised shadcn/ui-style Radix primitives
- Lucide React icons
- Supabase via `@supabase/supabase-js`
- Zod validation
- date-fns
- Recharts
- Browser MediaRecorder
- Sonner toasts

No separate Express server is used. All provider-facing calls are kept behind Next.js route handlers.

## Repository structure

```text
src/
  app/
    api/
      appointment-brief/
      encounters/import/
      patient-updates/
      transcribe/
    clinician/
    patient/
      prepare/
      timeline/
      update/
  components/
    clinician/
    evidence/
    patient/
    shared/
    timeline/
    ui/
  data/seed/
  lib/
    env.ts
    supabase.ts
    utils.ts
  server/
    http/
    repositories/
    schemas/
    services/
    types/
supabase/
  schema.sql
  seed.sql
```

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Quality commands:

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Environment variables

The app starts successfully with every value empty.

```bash
SUPABASE_URL=
SUPABASE_KEY=

GEMINI_API_KEY=
RUNWARE_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `SUPABASE_URL` and `SUPABASE_KEY` are read only by server-side modules. Use an appropriately scoped server credential for the prototype; production requires a complete authentication and authorization design.
- `GEMINI_API_KEY` belongs to the server-side health extraction service.
- `RUNWARE_API_KEY` belongs to the server-side transcription service.
- `NEXT_PUBLIC_APP_URL` is safe to expose and defaults to `http://localhost:3000`.

`.env` is ignored by Git. Never add real provider credentials to source control or expose them through a `NEXT_PUBLIC_` variable.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run [`supabase/schema.sql`](supabase/schema.sql) to create the tables, constraints, indexes, and updated-at helpers.
4. Run [`supabase/seed.sql`](supabase/seed.sql) to load the synthetic Amina scenario.
5. Add the project URL and suitable server key to `.env`.
6. Restart the Next.js process.

The schema includes:

- `patients`
- `timeline_events`
- `evidence_references`
- `appointment_briefs`
- `imported_encounters`

The SQL comments explicitly call out that production use requires full identity, row-level access control, consent, auditing, retention, governance, and clinical safety review. The V1 intentionally avoids pretending those concerns are solved.

## Fallback and persistence behaviour

Persistence is selected in this order:

1. **Supabase**, when both Supabase variables are present and a request succeeds.
2. **Local demo persistence**, with newly saved patient events stored in browser local storage.
3. **Seed data**, used as the deterministic initial story.

Missing provider keys do not break pages or APIs. Repository failures in development produce a clear warning and return the seeded scenario. Local events are merged after the client mounts, by stable ID, so server rendering remains deterministic and hydration-safe.

## API routes

| Route                                   | Purpose                                                                       | Current fallback                                              |
| --------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `GET/POST/PUT /api/patient-updates`     | List, organise, then persist the reviewed patient event without re-extraction | Deterministic structured update and fallback repository       |
| `POST /api/transcribe`                  | Receive an audio file through a server boundary                               | Seeded Urdu/English transcript when Runware is not configured |
| `POST /api/encounters/import`           | Simulate and persist an encounter import                                      | Synthetic UCLH record                                         |
| `GET/POST/PATCH /api/appointment-brief` | Read, generate, and update brief status                                       | Seeded evidence-linked brief                                  |

Route handlers validate inputs with Zod and return useful status/error payloads. Secrets are never read by client components.

## Gemini integration

The interface and implementations live in `src/server/services/ai-extraction-service.ts`.

- `FallbackHealthExtractionService` produces deterministic, safety-bounded output for the Amina scenario.
- `GeminiHealthExtractionService` is selected only when `GEMINI_API_KEY` is present and calls Gemini from the server.
- Patient update extraction, Threads observations, and appointment brief generation share the `HealthExtractionService` interface so the UI does not know which provider is active.

Before real-world use, provider output must receive stricter schema enforcement, prompt/version audit trails, evaluation, monitoring, and clinical safety review.

## Runware integration

The interface and implementations live in `src/server/services/transcription-service.ts`.

- `FallbackTranscriptionService` returns the deterministic demonstration transcript.
- `RunwareTranscriptionService` keeps audio bytes and credentials behind the server route.
- The configured Runware path deliberately returns an explicit unsupported-integration response until a supported speech-to-text model and request contract are confirmed. It does not invent an SDK call or fail silently.

The browser records only when the user grants microphone access. Denial and unsupported-browser states remain recoverable and the written-update path is always available.

## Safety boundaries

Threads must never:

- diagnose or present an organised pattern as a clinical conclusion;
- recommend treatment or advise starting/stopping medication;
- state that a patient is safe or that nothing urgent was detected;
- claim emergency monitoring;
- hide whether information was patient-reported, imported, translated, or AI-organised;
- claim direct NHS connectivity in this prototype.

The interface uses phrases such as “Amina reports,” “imported record states,” “Threads organised,” and “may be useful to discuss.” Every AI-organised observation is marked **not clinically verified** and can reveal its evidence.

## Synthetic-data disclaimer

This repository is a hackathon demonstration. Amina Khan is fictional. All organisations, dates, observations, blood results, medication context, translations, record references, and encounter payloads are synthetic demonstration data. No real patient information is included.

## Known limitations

- No authentication, identity matching, consent capture, role model, RLS policy set, or production clinical governance.
- Local fallback persistence is browser-specific and intended only for the demo.
- Voice processing uses a deterministic transcript unless a supported transcription provider contract is implemented.
- The external encounter connection and share/export action are simulations.
- Translation and evidence confidence are illustrative; source audio is not shipped with the repository.
- Trend charts reflect reported values and are not objective measurements.

## Highest-priority next integrations

1. **Secure data access:** add authentication, consent, patient/clinician authorization, RLS, audit trails, encryption policy, and retention controls.
2. **Validated provider pipelines:** confirm the Runware speech contract, harden Gemini structured output, add human-review states, and run multilingual and clinical-safety evaluations.
3. **Real interoperability:** implement a governed FHIR-based encounter import with patient matching, provenance, duplicate handling, and an approved appointment-brief sharing/export path.

## Future vision

Threads can become a longitudinal context layer across patient-reported experience and formal records: multilingual capture, FHIR-based imports, evidence-preserving summaries, clinician workflows, shared decision preparation, and outcome tracking. The core constraint remains unchanged: preserve source provenance, preserve the patient’s voice, and never turn AI-organised context into unsupported clinical certainty.

# ReimagineHack
