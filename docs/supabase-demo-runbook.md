# Supabase-backed demo runbook

Thread uses one synthetic Amina Khan record with ID
`11111111-1111-4111-8111-111111111111`. Keep all credentials out of source
control and use only fictional demonstration content.

## 1. Apply the schema and seed

In the Supabase SQL editor, run these files in order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/verify-demo.sql`

The schema enables RLS without adding permissive anonymous policies. The seed
is idempotent, migrates the legacy Amina ID to the canonical ID, and preserves
live rows. The verification results should show one Amina, 15 deterministic
historical timeline events, 15 deterministic evidence references, one brief,
and one imported encounter.

## 2. Configure local environment variables

Copy `.env.example` to `.env` and set:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
RUNWARE_API_KEY=...
TRANSCRIPTION_FALLBACK_ENABLED=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SECRET_KEY` is server-only and bypasses RLS for trusted repository
reads and writes. Never add `NEXT_PUBLIC_` to it. The current app has no browser
Supabase client, so it does not require public Supabase variables in the client
bundle. `SUPABASE_SERVICE_ROLE_KEY` is accepted only as a legacy alternative.

Restart `npm run dev` after changing environment variables.

## 3. Configure Vercel

Add the same production values in Project Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SECRET_KEY`
- `RUNWARE_API_KEY`
- `TRANSCRIPTION_FALLBACK_ENABLED`
- `NEXT_PUBLIC_APP_URL`

Redeploy after saving them. Do not expose or log the secret key.

## 4. Test a live recording

1. Open `/patient/update` and record a real Urdu or English voice update.
2. Confirm the transcript card says the update was added to the health story.
3. Refresh `/clinician/investigation`.
4. Confirm the new `Patient voice update` appears at the top of the timeline.
5. Open its evidence to inspect the original transcript and translation.

Run `supabase/verify-demo.sql`, or check the newest live records directly:

```sql
select id, source_id, occurred_at
from public.evidence_records
where patient_id = '11111111-1111-4111-8111-111111111111'
order by created_at desc;

select id, input_type, occurred_at
from public.patient_updates
where patient_id = '11111111-1111-4111-8111-111111111111'
order by created_at desc;

select id, event_type, recorded_at, structured_data
from public.timeline_events
where patient_id = '11111111-1111-4111-8111-111111111111'
order by recorded_at desc;
```

The three newest rows should share a timestamp. The timeline event's
`structured_data.patientUpdateId` and `evidenceRecordId` must match the raw row
IDs.

## 5. Confirm the data source

On a clinician page request, the server should log:

```text
[Thread data] Loaded clinician context from Supabase
```

If Supabase is missing or a query fails, the relevant repository logs:

```text
[Thread data] ... Supabase unavailable; using seeded fallback.
```

Fallback logs during a deployed demo indicate configuration, schema, RLS-key,
or seed problems that should be corrected before judging.
