-- Thread V1 synthetic demonstration data.
-- All people, encounters, observations, and record identifiers in this file are fictional.

begin;

insert into public.patients (
  id,
  name,
  date_of_birth,
  condition,
  preferred_language,
  avatar_url,
  created_at,
  updated_at
)
values (
  '10000000-0000-4000-8000-000000000001',
  'Amina Khan',
  '1993-10-11',
  'Endometriosis',
  'Urdu',
  null,
  '2026-04-14T09:10:00+01:00',
  '2026-07-17T09:00:00+01:00'
)
on conflict (id) do update set
  name = excluded.name,
  date_of_birth = excluded.date_of_birth,
  condition = excluded.condition,
  preferred_language = excluded.preferred_language,
  avatar_url = excluded.avatar_url,
  updated_at = excluded.updated_at;

insert into public.timeline_events (
  id,
  patient_id,
  event_type,
  title,
  summary,
  recorded_at,
  source_kind,
  organisation,
  location,
  language,
  original_text,
  translated_text,
  audio_url,
  severity,
  structured_data,
  created_at,
  updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'patient_text',
    'Pelvic pain before period',
    'Amina reported pelvic pain at 4/10 and fatigue, while still managing her normal activities.',
    '2026-04-14T09:10:00+01:00',
    'patient_reported',
    null,
    'Home',
    'en-GB',
    'My period is due soon. The pelvic pain is about four out of ten today and I feel tired, but I have managed my normal activities.',
    null,
    null,
    4,
    $json$
    {
      "symptoms": ["pelvic pain", "fatigue"],
      "bodyLocations": ["pelvis"],
      "functionalImpacts": ["Managed normal daily activities"],
      "cycleContext": "Period expected soon",
      "evidenceSentences": [
        "The pelvic pain is about four out of ten today.",
        "I feel tired, but I have managed my normal activities."
      ],
      "metadata": {"synthetic": true, "enteredBy": "patient"}
    }
    $json$::jsonb,
    '2026-04-14T09:10:00+01:00',
    '2026-04-14T09:10:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'medication_update',
    'Naproxen gave partial relief',
    'Amina took naproxen and reported partial pain relief with no side effects recorded.',
    '2026-04-18T18:40:00+01:00',
    'patient_reported',
    null,
    'Home',
    'en-GB',
    'I took the naproxen this afternoon. It took the edge off the pain but did not remove it. I did not notice any side effects.',
    null,
    null,
    null,
    $json$
    {
      "symptoms": ["pelvic pain"],
      "medicationDetails": {
        "medicationName": "Naproxen",
        "action": "Taken",
        "adherence": "Taken as intended",
        "effect": "Partial relief",
        "reportedSideEffects": []
      },
      "evidenceSentences": [
        "It took the edge off the pain but did not remove it.",
        "I did not notice any side effects."
      ],
      "metadata": {"synthetic": true, "enteredBy": "patient"}
    }
    $json$::jsonb,
    '2026-04-18T18:40:00+01:00',
    '2026-04-18T18:40:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'patient_text',
    'Pain increased before next period',
    'Pelvic pain was 5/10 with fatigue; Amina completed work and expected her period the following day.',
    '2026-05-14T08:30:00+01:00',
    'patient_reported',
    null,
    'Home',
    'en-GB',
    'Pelvic pain was around 5/10 today. My period is due tomorrow and I feel more tired than usual, but I completed my shift at work.',
    null,
    null,
    5,
    $json$
    {
      "symptoms": ["pelvic pain", "fatigue"],
      "bodyLocations": ["pelvis"],
      "functionalImpacts": ["Completed work shift despite symptoms"],
      "cycleContext": "Period expected the following day",
      "evidenceSentences": [
        "Pelvic pain was around 5/10 today.",
        "I completed my shift at work."
      ],
      "metadata": {"synthetic": true, "enteredBy": "patient"}
    }
    $json$::jsonb,
    '2026-05-14T08:30:00+01:00',
    '2026-05-14T08:30:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'ae_encounter',
    'UCLH Emergency Department',
    'Amina attended with severe pelvic pain rated 8/10. Observations were stable, displayed blood results were within range, and she was discharged with follow-up and return advice.',
    '2026-05-17T02:15:00+01:00',
    'imported_clinical_record',
    'University College London Hospital',
    'Emergency Department',
    'en-GB',
    null,
    null,
    null,
    8,
    $json$
    {
      "reason": "Severe pelvic pain",
      "symptoms": ["worsening lower abdominal pain", "pelvic pain"],
      "bodyLocations": ["lower abdomen", "pelvis"],
      "observations": {
        "heartRate": "84 bpm",
        "bloodPressure": "124/78 mmHg",
        "temperature": "36.8 °C",
        "oxygenSaturation": "99%",
        "respiratoryRate": "16 breaths/min"
      },
      "bloodResults": [
        {"name": "Haemoglobin", "value": "126 g/L", "status": "within_range"},
        {"name": "White cell count", "value": "7.4 ×10⁹/L", "status": "within_range"},
        {"name": "CRP", "value": "3 mg/L", "status": "within_range"},
        {"name": "Platelets", "value": "284 ×10⁹/L", "status": "within_range"},
        {"name": "Pregnancy test", "value": "Negative", "status": "within_range"}
      ],
      "interventions": ["Analgesia administered"],
      "disposition": "Discharged home",
      "followUp": "Advised to arrange GP follow-up",
      "returnAdvice": "Return if symptoms significantly worsen",
      "clinicianNote": "Worsening lower abdominal and pelvic pain. Observations stable. Pregnancy test negative. Displayed blood results within reference ranges. Analgesia given; discharged with safety-net advice.",
      "metadata": {
        "synthetic": true,
        "imported": true,
        "source": "Synthetic UCLH discharge record",
        "enteredByPatient": false,
        "recordId": "SYNTH-UCLH-ED-2026-05-17-AK"
      }
    }
    $json$::jsonb,
    '2026-05-17T04:45:00+01:00',
    '2026-05-17T04:45:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    'patient_text',
    'Pain eased after A&E visit',
    'Pain had improved since the emergency visit, but pelvic heaviness continued and Amina worried the severe pain might return.',
    '2026-05-20T19:05:00+01:00',
    'patient_reported',
    null,
    'Home',
    'en-GB',
    'The sharp pain has eased since A&E, but I still have a heavy feeling in my pelvis. I am worried the severe pain will come back.',
    null,
    null,
    null,
    $json$
    {
      "symptoms": ["pelvic heaviness", "residual pelvic pain"],
      "bodyLocations": ["pelvis"],
      "functionalImpacts": ["Concern about recurrence"],
      "evidenceSentences": [
        "The sharp pain has eased since A&E, but I still have a heavy feeling in my pelvis.",
        "I am worried the severe pain will come back."
      ],
      "metadata": {"synthetic": true, "enteredBy": "patient", "followsEncounterId": "20000000-0000-4000-8000-000000000004"}
    }
    $json$::jsonb,
    '2026-05-20T19:05:00+01:00',
    '2026-05-20T19:05:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    'gp_review',
    'GP follow-up after A&E',
    'The GP reviewed Amina after the emergency attendance, discussed naproxen, made a gynaecology referral, and asked her to track symptoms.',
    '2026-05-28T11:00:00+01:00',
    'imported_clinical_record',
    'Camden Health Centre',
    'General Practice',
    'en-GB',
    null,
    null,
    null,
    null,
    $json$
    {
      "reason": "Follow-up after emergency attendance for pelvic pain",
      "medicationDetails": {
        "medicationName": "Naproxen",
        "action": "Discussed/prescribed",
        "adherence": "As directed when required",
        "reportedSideEffects": []
      },
      "actions": [
        "Reviewed emergency department discharge information",
        "Discussed naproxen for pain",
        "Gynaecology referral made",
        "Advised patient to track symptoms"
      ],
      "metadata": {
        "synthetic": true,
        "imported": true,
        "source": "Synthetic GP encounter summary",
        "recordId": "SYN-GP-2026-05-28-AMINA"
      }
    }
    $json$::jsonb,
    '2026-05-28T12:15:00+01:00',
    '2026-05-28T12:15:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000001',
    'patient_voice',
    'Pain spread to lower back at work',
    'In an Urdu voice update, Amina reported 7/10 lower abdominal pain spreading to her lower back and said she had to leave work early.',
    '2026-06-12T08:15:00+01:00',
    'patient_reported',
    null,
    'Home',
    'ur-Latn',
    'Kal raat mere pait ke neeche bohat tez dard tha, takreeban saat das mein se. Dard kamar tak ja raha tha. Main kaam par zyada dair khari nahi reh saki aur jaldi ghar aana para.',
    'Last night I had strong pain in my lower abdomen, around seven out of ten. The pain spread to my lower back. I could not stand for long at work and had to leave early.',
    null,
    7,
    $json$
    {
      "symptoms": ["lower abdominal pain", "lower-back pain"],
      "bodyLocations": ["lower abdomen", "lower back"],
      "functionalImpacts": ["Could not stand for long at work", "Left work early"],
      "evidenceSentences": [
        "The pain was around seven out of ten.",
        "I could not stand for long at work and had to leave early."
      ],
      "translationReviewed": false,
      "metadata": {
        "synthetic": true,
        "enteredBy": "patient",
        "inputMode": "voice",
        "transcriptionMode": "seeded demonstration"
      }
    }
    $json$::jsonb,
    '2026-06-12T08:15:00+01:00',
    '2026-06-12T08:15:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    'medication_update',
    'Nausea after prescribed medication',
    'Amina reported nausea after taking her prescribed pain medication and felt unsure about taking another dose.',
    '2026-06-13T20:10:00+01:00',
    'patient_reported',
    null,
    'Home',
    'en-GB',
    'I took the prescribed pain medicine after dinner and felt very nauseous afterwards. I am not sure whether I should take another dose if the pain comes back.',
    null,
    null,
    null,
    $json$
    {
      "symptoms": ["nausea"],
      "medicationDetails": {
        "medicationName": "Prescribed pain medication",
        "action": "Taken",
        "adherence": "Uncertain about next dose",
        "reportedSideEffects": ["nausea"]
      },
      "questionsForNextAppointment": ["Are there options that may cause less nausea?"],
      "evidenceSentences": [
        "I felt very nauseous afterwards.",
        "I am not sure whether I should take another dose."
      ],
      "metadata": {"synthetic": true, "enteredBy": "patient"}
    }
    $json$::jsonb,
    '2026-06-13T20:10:00+01:00',
    '2026-06-13T20:10:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000001',
    'patient_text',
    'Fatigue and poor sleep',
    'Amina reported ongoing fatigue, pelvic pain at 5/10, and poor sleep without missing work.',
    '2026-06-21T09:25:00+01:00',
    'patient_reported',
    null,
    'Home',
    'en-GB',
    'I am still very tired. The pain is about 5/10 today and I slept badly last night. I have not needed to miss work.',
    null,
    null,
    5,
    $json$
    {
      "symptoms": ["pelvic pain", "fatigue"],
      "bodyLocations": ["pelvis"],
      "functionalImpacts": ["Sleep was poor", "No work absence"],
      "sleepImpact": "Slept badly the previous night",
      "evidenceSentences": [
        "The pain is about 5/10 today.",
        "I slept badly last night.",
        "I have not needed to miss work."
      ],
      "metadata": {"synthetic": true, "enteredBy": "patient"}
    }
    $json$::jsonb,
    '2026-06-21T09:25:00+01:00',
    '2026-06-21T09:25:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000001',
    'referral',
    'Gynaecology appointment booked',
    'A consultant gynaecology review was booked for 24 July 2026 at University College London Hospital.',
    '2026-07-04T14:30:00+01:00',
    'imported_clinical_record',
    'University College London Hospital',
    'Gynaecology',
    'en-GB',
    null,
    null,
    null,
    null,
    $json$
    {
      "appointment": {
        "title": "Gynaecology review",
        "organisation": "University College London Hospital",
        "appointmentDate": "2026-07-24T10:30:00+01:00",
        "appointmentType": "Consultant review"
      },
      "patientStatedAim": "Discuss worsening symptoms",
      "metadata": {
        "synthetic": true,
        "imported": true,
        "source": "Synthetic referral booking notification",
        "recordId": "SYN-UCLH-GYN-BOOKING-2026-07-24-AMINA"
      }
    }
    $json$::jsonb,
    '2026-07-04T14:35:00+01:00',
    '2026-07-04T14:35:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000001',
    'patient_voice',
    'Pain woke Amina overnight',
    'Amina reported pelvic and lower-back pain at 8/10 that woke her overnight; she avoided medication because of earlier nausea.',
    '2026-07-10T06:50:00+01:00',
    'patient_reported',
    null,
    'Home',
    'en-GB',
    'The pain woke me up in the night. It was about eight out of ten across my pelvis and lower back. I did not take the tablets because I was worried the nausea would happen again.',
    null,
    null,
    8,
    $json$
    {
      "symptoms": ["pelvic pain", "lower-back pain"],
      "bodyLocations": ["pelvis", "lower back"],
      "functionalImpacts": ["Woken from sleep"],
      "sleepImpact": "Pain woke patient overnight",
      "medicationDetails": {
        "medicationName": "Prescribed pain medication",
        "action": "Dose avoided",
        "adherence": "Avoided because of concern about recurring nausea",
        "reportedSideEffects": ["previous nausea"]
      },
      "evidenceSentences": [
        "The pain woke me up in the night.",
        "It was about eight out of ten across my pelvis and lower back.",
        "I did not take the tablets because I was worried the nausea would happen again."
      ],
      "metadata": {
        "synthetic": true,
        "enteredBy": "patient",
        "inputMode": "voice",
        "transcriptionMode": "seeded demonstration"
      }
    }
    $json$::jsonb,
    '2026-07-10T06:50:00+01:00',
    '2026-07-10T06:50:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000001',
    'patient_text',
    'Pain affected confidence at work',
    'When her period began, standing increased Amina’s discomfort. She nearly called in sick, left work early, and wanted a pain option that did not cause nausea.',
    '2026-07-16T12:35:00+01:00',
    'patient_reported',
    null,
    'Work',
    'en-GB',
    'My period started today. I nearly called in sick because standing made the discomfort worse. I tried to go in but left early, and I am losing confidence about managing this at work. I want to ask if there is another option that will not make me feel sick.',
    null,
    null,
    null,
    $json$
    {
      "symptoms": ["pelvic discomfort", "medication-related nausea concern"],
      "bodyLocations": ["pelvis"],
      "functionalImpacts": [
        "Nearly called in sick",
        "Standing increased discomfort",
        "Left work early",
        "Reduced confidence at work"
      ],
      "cycleContext": "Period began",
      "questionsForNextAppointment": [
        "Is there another pain-management option that may cause less nausea?"
      ],
      "evidenceSentences": [
        "I nearly called in sick because standing made the discomfort worse.",
        "I tried to go in but left early.",
        "I want to ask if there is another option that will not make me feel sick."
      ],
      "metadata": {"synthetic": true, "enteredBy": "patient"}
    }
    $json$::jsonb,
    '2026-07-16T12:35:00+01:00',
    '2026-07-16T12:35:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000014',
    '10000000-0000-4000-8000-000000000001',
    'gp_review',
    'GP symptom-tracking review',
    'The imported GP record states that Amina continued to report cyclical pelvic pain. The referral remained in progress and symptom tracking was discussed.',
    '2026-06-04T15:40:00+01:00',
    'imported_clinical_record',
    'Bloomsbury Surgery',
    'London',
    'en-GB',
    null,
    null,
    null,
    null,
    $json$
    {
      "symptoms": ["Ongoing cyclical pelvic pain"],
      "clinicianNote": "Patient reports ongoing cyclical pelvic pain. Referral remains in progress; advised to continue tracking symptoms for specialist review.",
      "metadata": {"synthetic": true, "imported": true}
    }
    $json$::jsonb,
    '2026-06-04T15:40:00+01:00',
    '2026-06-04T15:40:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000015',
    '10000000-0000-4000-8000-000000000001',
    'patient_text',
    'Left work early for a second time',
    'Amina reported pain at 6/10 and left her shift early after standing made it worse.',
    '2026-06-30T17:48:00+01:00',
    'patient_reported',
    null,
    'Work',
    'en-GB',
    'Pain was 6/10 this afternoon. I tried to keep working but standing made it worse, so I left my shift early for the second time this month.',
    null,
    null,
    6,
    $json$
    {
      "symptoms": ["Pelvic pain", "Pain worse while standing"],
      "bodyLocations": ["Pelvis"],
      "functionalImpacts": ["Left work early", "Difficulty standing"],
      "metadata": {"synthetic": true, "enteredBy": "patient"}
    }
    $json$::jsonb,
    '2026-06-30T17:48:00+01:00',
    '2026-06-30T17:48:00+01:00'
  ),
  (
    '20000000-0000-4000-8000-000000000013',
    '10000000-0000-4000-8000-000000000001',
    'ai_observation',
    'What Thread has noticed',
    'Recorded pelvic pain increased across the last three cycles. Recent updates also describe interrupted sleep, medication-related nausea concerns, and increasing impact on work.',
    '2026-07-17T09:00:00+01:00',
    'ai_organised',
    null,
    null,
    'en-GB',
    null,
    null,
    null,
    null,
    $json$
    {
      "badge": "AI-organised",
      "clinicalVerification": "Not clinically verified",
      "disclaimer": "This observation organises recorded information. It is not a diagnosis or treatment recommendation.",
      "supportingSummary": "Based on 5 patient updates and 2 healthcare encounters.",
      "observations": [
        {
          "text": "Pain severity increased across the last three recorded cycles.",
          "evidenceReferenceIds": [
            "30000000-0000-4000-8000-000000000002",
            "30000000-0000-4000-8000-000000000003",
            "30000000-0000-4000-8000-000000000004"
          ]
        },
        {
          "text": "Sleep disruption appeared in recent updates.",
          "evidenceReferenceIds": [
            "30000000-0000-4000-8000-000000000005",
            "30000000-0000-4000-8000-000000000006"
          ]
        },
        {
          "text": "Medication use was affected by patient-reported nausea.",
          "evidenceReferenceIds": [
            "30000000-0000-4000-8000-000000000007",
            "30000000-0000-4000-8000-000000000008",
            "30000000-0000-4000-8000-000000000009"
          ]
        },
        {
          "text": "Work was affected on two recorded occasions.",
          "evidenceReferenceIds": [
            "30000000-0000-4000-8000-000000000010",
            "30000000-0000-4000-8000-000000000011"
          ]
        },
        {
          "text": "Symptoms continued after the emergency attendance.",
          "evidenceReferenceIds": [
            "30000000-0000-4000-8000-000000000012",
            "30000000-0000-4000-8000-000000000013",
            "30000000-0000-4000-8000-000000000014"
          ]
        }
      ],
      "supportingEventIds": [
        "20000000-0000-4000-8000-000000000003",
        "20000000-0000-4000-8000-000000000004",
        "20000000-0000-4000-8000-000000000006",
        "20000000-0000-4000-8000-000000000007",
        "20000000-0000-4000-8000-000000000009",
        "20000000-0000-4000-8000-000000000011",
        "20000000-0000-4000-8000-000000000012"
      ],
      "metadata": {"synthetic": true, "model": "deterministic-seeded-fallback"}
    }
    $json$::jsonb,
    '2026-07-17T09:00:00+01:00',
    '2026-07-17T09:00:00+01:00'
  )
on conflict (id) do update set
  patient_id = excluded.patient_id,
  event_type = excluded.event_type,
  title = excluded.title,
  summary = excluded.summary,
  recorded_at = excluded.recorded_at,
  source_kind = excluded.source_kind,
  organisation = excluded.organisation,
  location = excluded.location,
  language = excluded.language,
  original_text = excluded.original_text,
  translated_text = excluded.translated_text,
  audio_url = excluded.audio_url,
  severity = excluded.severity,
  structured_data = excluded.structured_data,
  updated_at = excluded.updated_at;

insert into public.evidence_references (
  id,
  event_id,
  supporting_event_id,
  source_kind,
  label,
  excerpt,
  original_excerpt,
  translated_excerpt,
  field,
  recorded_at,
  created_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000001',
    'patient_reported',
    '14 April patient text · pain 4/10',
    'The pelvic pain is about four out of ten today.',
    null,
    null,
    'severity',
    '2026-04-14T09:10:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000003',
    'patient_reported',
    '14 May patient text · pain 5/10',
    'Pelvic pain was around 5/10 today.',
    null,
    null,
    'severity',
    '2026-05-14T08:30:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000007',
    'patient_reported',
    '12 June translated Urdu voice update · pain 7/10',
    'The pain was around seven out of ten.',
    'Dard ... takreeban saat das mein se.',
    'The pain was around seven out of ten.',
    'severity',
    '2026-06-12T08:15:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000011',
    'patient_reported',
    '10 July patient voice update · pain 8/10',
    'It was about eight out of ten across my pelvis and lower back.',
    null,
    null,
    'severity',
    '2026-07-10T06:50:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000009',
    'patient_reported',
    '21 June patient text · poor sleep',
    'I slept badly last night.',
    null,
    null,
    'structured_data.sleepImpact',
    '2026-06-21T09:25:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000011',
    'patient_reported',
    '10 July patient voice update · woken overnight',
    'The pain woke me up in the night.',
    null,
    null,
    'structured_data.sleepImpact',
    '2026-07-10T06:50:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000008',
    'patient_reported',
    '13 June medication update · nausea',
    'I took the prescribed pain medicine after dinner and felt very nauseous afterwards.',
    null,
    null,
    'structured_data.medicationDetails.reportedSideEffects',
    '2026-06-13T20:10:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000011',
    'patient_reported',
    '10 July patient voice update · dose avoided',
    'I did not take the tablets because I was worried the nausea would happen again.',
    null,
    null,
    'structured_data.medicationDetails.adherence',
    '2026-07-10T06:50:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000009',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000012',
    'patient_reported',
    '16 July patient text · asks about alternatives',
    'I want to ask if there is another option that will not make me feel sick.',
    null,
    null,
    'structured_data.questionsForNextAppointment',
    '2026-07-16T12:35:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000007',
    'patient_reported',
    '12 June translated Urdu voice update · left work early',
    'I could not stand for long at work and had to leave early.',
    'Main kaam par zyada dair khari nahi reh saki aur jaldi ghar aana para.',
    'I could not stand for long at work and had to leave early.',
    'structured_data.functionalImpacts',
    '2026-06-12T08:15:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000011',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000012',
    'patient_reported',
    '16 July patient text · work affected',
    'I nearly called in sick because standing made the discomfort worse. I tried to go in but left early.',
    null,
    null,
    'structured_data.functionalImpacts',
    '2026-07-16T12:35:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000012',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000004',
    'imported_clinical_record',
    '17 May imported UCLH emergency encounter',
    'Presented with worsening lower abdominal and pelvic pain. Pain reported as 8/10.',
    null,
    null,
    'structured_data.clinicianNote',
    '2026-05-17T02:15:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000005',
    'patient_reported',
    '20 May patient text · symptoms after A&E',
    'The sharp pain has eased since A&E, but I still have a heavy feeling in my pelvis.',
    null,
    null,
    'original_text',
    '2026-05-20T19:05:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000014',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000006',
    'imported_clinical_record',
    '28 May imported GP review · follow-up and referral',
    'Reviewed after A&E visit. Gynaecology referral made and patient advised to track symptoms.',
    null,
    null,
    'structured_data.actions',
    '2026-05-28T11:00:00+01:00',
    '2026-07-17T09:00:00+01:00'
  ),
  (
    '30000000-0000-4000-8000-000000000015',
    '20000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000004',
    'imported_clinical_record',
    '17 May UCLH discharge record · observations and disposition',
    'Observations stable. Displayed blood results were within reference ranges. Analgesia administered; discharged home with GP follow-up and return advice.',
    null,
    null,
    'structured_data.disposition',
    '2026-05-17T02:15:00+01:00',
    '2026-07-17T09:00:00+01:00'
  )
on conflict (id) do update set
  event_id = excluded.event_id,
  supporting_event_id = excluded.supporting_event_id,
  source_kind = excluded.source_kind,
  label = excluded.label,
  excerpt = excluded.excerpt,
  original_excerpt = excluded.original_excerpt,
  translated_excerpt = excluded.translated_excerpt,
  field = excluded.field,
  recorded_at = excluded.recorded_at;

insert into public.appointment_briefs (
  id,
  patient_id,
  appointment_date,
  status,
  patient_priorities,
  summary,
  created_at,
  updated_at
)
values (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '2026-07-24T10:30:00+01:00',
  'draft',
  $json$
  [
    {
      "id": "better-pain-control",
      "label": "Better pain control",
      "selected": true,
      "evidenceReferenceIds": [
        "30000000-0000-4000-8000-000000000002",
        "30000000-0000-4000-8000-000000000003",
        "30000000-0000-4000-8000-000000000004"
      ]
    },
    {
      "id": "medication-side-effects",
      "label": "Medication side effects",
      "selected": true,
      "evidenceReferenceIds": [
        "30000000-0000-4000-8000-000000000007",
        "30000000-0000-4000-8000-000000000008",
        "30000000-0000-4000-8000-000000000009"
      ]
    },
    {
      "id": "impact-on-work",
      "label": "Impact on work",
      "selected": true,
      "evidenceReferenceIds": [
        "30000000-0000-4000-8000-000000000010",
        "30000000-0000-4000-8000-000000000011"
      ]
    },
    {"id": "interrupted-sleep", "label": "Interrupted sleep", "selected": false},
    {"id": "understanding-next-steps", "label": "Understanding next steps", "selected": false}
  ]
  $json$::jsonb,
  $json$
  {
    "appointment": {
      "title": "Gynaecology review",
      "organisation": "University College London Hospital",
      "appointmentType": "Consultant review",
      "date": "2026-07-24T10:30:00+01:00"
    },
    "disclaimer": "AI-organised, not clinically verified. Review before sharing. This brief does not provide a diagnosis or treatment recommendation.",
    "reviewBeforeSharing": true,
    "mainConcern": {
      "text": "Amina reports worsening pelvic and lower-back pain across the last three recorded cycles.",
      "evidenceReferenceIds": [
        "30000000-0000-4000-8000-000000000002",
        "30000000-0000-4000-8000-000000000003",
        "30000000-0000-4000-8000-000000000004"
      ]
    },
    "changesSinceLastReview": [
      {
        "text": "Pain increased from 5/10 to 8/10 in patient-recorded updates.",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000002",
          "30000000-0000-4000-8000-000000000003",
          "30000000-0000-4000-8000-000000000004"
        ]
      },
      {
        "text": "Symptoms have interrupted sleep.",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000005",
          "30000000-0000-4000-8000-000000000006"
        ]
      },
      {
        "text": "Amina left work early on two recorded occasions.",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000010",
          "30000000-0000-4000-8000-000000000011"
        ]
      },
      {
        "text": "Symptoms persisted after the May emergency attendance.",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000012",
          "30000000-0000-4000-8000-000000000013",
          "30000000-0000-4000-8000-000000000014"
        ]
      }
    ],
    "medication": [
      {
        "text": "Amina reports nausea after taking prescribed pain medication.",
        "evidenceReferenceIds": ["30000000-0000-4000-8000-000000000007"]
      },
      {
        "text": "She later avoided a dose because she was concerned about the nausea recurring.",
        "evidenceReferenceIds": ["30000000-0000-4000-8000-000000000008"]
      }
    ],
    "relevantEncounter": [
      {
        "text": "UCLH Emergency Department attendance on 17 May 2026 for severe pelvic pain.",
        "evidenceReferenceIds": ["30000000-0000-4000-8000-000000000012"]
      },
      {
        "text": "Observations were stable and displayed blood results were within reference ranges.",
        "evidenceReferenceIds": ["30000000-0000-4000-8000-000000000015"]
      },
      {
        "text": "Amina was discharged with GP follow-up and return advice.",
        "evidenceReferenceIds": ["30000000-0000-4000-8000-000000000015"]
      }
    ],
    "patientPriorities": [
      {
        "text": "Discuss pain management.",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000002",
          "30000000-0000-4000-8000-000000000003",
          "30000000-0000-4000-8000-000000000004"
        ]
      },
      {
        "text": "Discuss medication-related nausea.",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000007",
          "30000000-0000-4000-8000-000000000009"
        ]
      },
      {
        "text": "Discuss the impact on work.",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000010",
          "30000000-0000-4000-8000-000000000011"
        ]
      }
    ],
    "patientQuestions": [
      {
        "text": "Are there alternative options that may cause less nausea?",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000007",
          "30000000-0000-4000-8000-000000000009"
        ]
      },
      {
        "text": "Why has the pain been increasing?",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000002",
          "30000000-0000-4000-8000-000000000003",
          "30000000-0000-4000-8000-000000000004"
        ]
      },
      {
        "text": "What are the next steps in her care?",
        "evidenceReferenceIds": [
          "30000000-0000-4000-8000-000000000009",
          "30000000-0000-4000-8000-000000000014"
        ]
      }
    ],
    "generatedFromEventId": "20000000-0000-4000-8000-000000000013",
    "generatedAt": "2026-07-17T09:05:00+01:00"
  }
  $json$::jsonb,
  '2026-07-17T09:05:00+01:00',
  '2026-07-17T09:05:00+01:00'
)
on conflict (id) do update set
  patient_id = excluded.patient_id,
  appointment_date = excluded.appointment_date,
  status = excluded.status,
  patient_priorities = excluded.patient_priorities,
  summary = excluded.summary,
  updated_at = excluded.updated_at;

insert into public.imported_encounters (
  id,
  patient_id,
  timeline_event_id,
  provider,
  encounter_type,
  encounter_date,
  source_reference,
  raw_payload,
  structured_data,
  created_at
)
values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000004',
  'University College London Hospital',
  'Emergency Department attendance',
  '2026-05-17T02:15:00+01:00',
  'SYNTH-UCLH-ED-2026-05-17-AK',
  $json$
  {
    "resourceType": "SyntheticEncounterRecord",
    "recordId": "SYNTH-UCLH-ED-2026-05-17-AK",
    "synthetic": true,
    "source": "Synthetic UCLH discharge record",
    "patient": {"display": "Amina Khan", "syntheticPatientId": "THREAD-AMINA-001"},
    "encounter": {
      "status": "finished",
      "service": "Emergency Department",
      "startedAt": "2026-05-17T02:15:00+01:00",
      "endedAt": "2026-05-17T04:32:00+01:00",
      "chiefConcern": "Severe pelvic pain",
      "reportedPainSeverity": 8
    },
    "triage": {
      "heartRateBpm": 84,
      "bloodPressure": "124/78 mmHg",
      "temperatureCelsius": 36.8,
      "oxygenSaturationPercent": 99,
      "respiratoryRatePerMinute": 16
    },
    "laboratory": [
      {"name": "Haemoglobin", "value": 126, "unit": "g/L", "displayedStatus": "within_range"},
      {"name": "White cell count", "value": 7.4, "unit": "×10⁹/L", "displayedStatus": "within_range"},
      {"name": "CRP", "value": 3, "unit": "mg/L", "displayedStatus": "within_range"},
      {"name": "Platelets", "value": 284, "unit": "×10⁹/L", "displayedStatus": "within_range"},
      {"name": "Pregnancy test", "value": "Negative", "displayedStatus": "within_range"}
    ],
    "treatment": ["Analgesia administered"],
    "disposition": "Discharged home",
    "followUp": "Arrange GP follow-up",
    "safetyNet": "Return if symptoms significantly worsen"
  }
  $json$::jsonb,
  $json$
  {
    "title": "UCLH Emergency Department",
    "reason": "Severe pelvic pain",
    "summary": [
      "Presented with worsening lower abdominal and pelvic pain",
      "Pain reported as 8/10",
      "Pregnancy test negative",
      "Haemoglobin, white cell count, CRP, and platelets displayed within reference ranges",
      "Observations stable",
      "Analgesia administered",
      "Discharged home",
      "Advised to arrange GP follow-up",
      "Return advice provided if symptoms significantly worsen"
    ],
    "observations": [
      {"name": "Heart rate", "value": "84 bpm"},
      {"name": "Blood pressure", "value": "124/78 mmHg"},
      {"name": "Temperature", "value": "36.8 °C"},
      {"name": "Oxygen saturation", "value": "99%"},
      {"name": "Respiratory rate", "value": "16 breaths/min"}
    ],
    "bloodResults": [
      {"name": "Haemoglobin", "value": "126 g/L", "status": "within_range"},
      {"name": "White cell count", "value": "7.4 ×10⁹/L", "status": "within_range"},
      {"name": "CRP", "value": "3 mg/L", "status": "within_range"},
      {"name": "Platelets", "value": "284 ×10⁹/L", "status": "within_range"},
      {"name": "Pregnancy test", "value": "Negative", "status": "within_range"}
    ],
    "clinicianNote": "Worsening lower abdominal and pelvic pain. Observations stable. Pregnancy test negative. Displayed blood results within reference ranges. Analgesia given; discharged with GP follow-up and safety-net advice.",
    "sourceRecord": {
      "label": "Synthetic UCLH discharge record",
      "reference": "SYNTH-UCLH-ED-2026-05-17-AK",
      "imported": true,
      "enteredByPatient": false,
      "synthetic": true
    }
  }
  $json$::jsonb,
  '2026-07-17T09:10:00+01:00'
)
on conflict (id) do update set
  patient_id = excluded.patient_id,
  timeline_event_id = excluded.timeline_event_id,
  provider = excluded.provider,
  encounter_type = excluded.encounter_type,
  encounter_date = excluded.encounter_date,
  source_reference = excluded.source_reference,
  raw_payload = excluded.raw_payload,
  structured_data = excluded.structured_data;

commit;
