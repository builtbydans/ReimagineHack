-- Thread Supabase demo verification. Run after schema.sql and seed.sql.

select id, name, date_of_birth, condition, preferred_language
from public.patients
where id = '11111111-1111-4111-8111-111111111111';

select id, name, date_of_birth
from public.patients
where lower(name) = 'amina khan';

select count(*) as expected_15_seeded_timeline_events
from public.timeline_events
where patient_id = '11111111-1111-4111-8111-111111111111'
  and id::text like '20000000-0000-4000-8000-%';

select count(*) as expected_15_seeded_evidence_references
from public.evidence_references
where id::text like '30000000-0000-4000-8000-%';

select id, patient_id, appointment_date, status, summary
from public.appointment_briefs
where patient_id = '11111111-1111-4111-8111-111111111111';

select id, provider, encounter_type, encounter_date, timeline_event_id
from public.imported_encounters
where patient_id = '11111111-1111-4111-8111-111111111111';

select id, input_type, original_language, processing_status, occurred_at
from public.patient_updates
where patient_id = '11111111-1111-4111-8111-111111111111'
order by created_at desc;

select id, source_type, source_id, title, metadata, occurred_at
from public.evidence_records
where patient_id = '11111111-1111-4111-8111-111111111111'
order by created_at desc;

select id, event_type, title, recorded_at, structured_data
from public.timeline_events
where patient_id = '11111111-1111-4111-8111-111111111111'
order by recorded_at desc;
