export interface QuickMessage {
  id: string;
  en: string;
  hi: string;
}

/** Curated local sentence suggestions used in Parent Mode — no network call. */
export const QUICK_MESSAGES: QuickMessage[] = [
  { id: 'qm-01', en: 'I need help', hi: 'मुझे मदद चाहिए' },
  { id: 'qm-02', en: 'I love you', hi: 'मैं तुमसे प्यार करता/करती हूँ' },
  { id: 'qm-03', en: 'Are you hungry?', hi: 'क्या तुम्हें भूख लगी है?' },
  { id: 'qm-04', en: 'It is time to go', hi: 'जाने का समय हो गया है' },
  { id: 'qm-05', en: 'Thank you', hi: 'धन्यवाद' },
  { id: 'qm-06', en: 'I am proud of you', hi: 'मुझे तुम पर गर्व है' },
];
