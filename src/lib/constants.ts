export const DEMO_PATIENT_ID = "10000000-0000-4000-8000-000000000001";

export const DEMO_AE_EVENT_ID = "20000000-0000-4000-8000-000000000004";

export const DEMO_OBSERVATION_EVENT_ID =
  "20000000-0000-4000-8000-000000000013";

export const DEMO_APPOINTMENT_BRIEF_ID =
  "40000000-0000-4000-8000-000000000001";

export const DEMO_IMPORTED_ENCOUNTER_ID =
  "50000000-0000-4000-8000-000000000001";

export const DEFAULT_APPOINTMENT_PRIORITIES = [
  "Better pain control",
  "Medication side effects",
  "Impact on work",
] as const;

export const AVAILABLE_APPOINTMENT_PRIORITIES = [
  ...DEFAULT_APPOINTMENT_PRIORITIES,
  "Interrupted sleep",
  "Understanding next steps",
] as const;

export const FALLBACK_TRANSCRIPT =
  "The pain woke me during the night. It was about eight out of ten in my pelvis and lower back. I did not take the pain medication because I was worried the nausea would happen again, and I am concerned about getting through work.";

export const FALLBACK_ROMAN_URDU_TRANSCRIPT =
  "Kal raat mere pait ke neeche bohat tez dard tha, takreeban saat das mein se. Dard kamar tak ja raha tha. Main kaam par zyada dair khari nahi reh saki aur jaldi ghar aana para.";

export const FALLBACK_ROMAN_URDU_TRANSLATION =
  "Last night I had strong pain in my lower abdomen, around seven out of ten. The pain spread to my lower back. I could not stand for long at work and had to leave early.";

export const SAFETY_NOTICE =
  "Thread does not provide emergency monitoring or medical advice. If you need urgent help, contact the appropriate emergency service.";

export const MAX_AUDIO_UPLOAD_BYTES = 15 * 1024 * 1024;
