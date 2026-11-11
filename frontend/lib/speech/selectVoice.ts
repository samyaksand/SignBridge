// Shared voice-selection helper for Web Speech API (SpeechSynthesis) usage
// across SignBridge. The set of voices available via
// `speechSynthesis.getVoices()` is entirely determined by the end user's own
// operating system and browser: SignBridge cannot bundle, force, or
// guarantee any specific voice exists on a given device. This helper only
// expresses a best-effort PREFERENCE (female voice, and a Hindi or English
// voice depending on the chosen speech language) and always falls back
// gracefully to whatever the browser provides, including undefined (letting
// the browser pick its own default) when no voices are available at all.

export type SpeechLanguage = 'en' | 'hi';

// Names that real browsers/operating systems are known to use for female
// voices. This is a heuristic, not a guarantee: the Web Speech API has no
// structured "gender" field, so we match on well-known real voice name
// patterns observed across Chrome, Edge, Windows, and macOS.
const FEMALE_NAME_HINTS = [
  'female',
  'woman',
  // Hindi voices
  'lekha',
  'heera',
  'kalpana',
  // English voices
  'zira',
  'samantha',
  'susan',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'veena',
  'google us english',
];

function nameSuggestsFemale(name: string): boolean {
  const lower = name.toLowerCase();
  return FEMALE_NAME_HINTS.some((hint) => lower.includes(hint));
}

function isHindiVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('hi');
}

function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('en');
}

function isGoogleHindi(voice: SpeechSynthesisVoice): boolean {
  // Google's Hindi voice is usually named "Google हिन्दी" and does not carry
  // an explicit gender marker in its name, but since it is typically the
  // only Hindi option on Chrome/Android, we prefer it over no Hindi voice at
  // all when no better (explicitly female) match exists.
  return voice.name.toLowerCase().includes('google') && isHindiVoice(voice);
}

/**
 * Picks the best-effort preferred voice for the given speech language,
 * preferring a female-sounding voice within that language. Returns undefined
 * if no voices are available at all (a legitimate outcome on some systems),
 * in which case callers should leave `utterance.voice` unset and let the
 * browser use its own default.
 *
 * Preference order for `language: 'hi'`:
 *   1. A Hindi voice whose name suggests female (Lekha, Heera, Kalpana, etc).
 *   2. Google's Hindi voice ("Google हिन्दी"), even without an explicit
 *      gender marker, since it is usually the only Hindi option available.
 *   3. Any other Hindi voice.
 *   4. A female-sounding voice in any language (better than a male voice in
 *      the wrong language, since language itself is not guaranteed to exist
 *      on this device either).
 *   5. The browser's first available voice, or undefined.
 *
 * Preference order for `language: 'en'`:
 *   1. An English voice whose name suggests female (Zira, Samantha, Google
 *      US English, etc).
 *   2. Any other English voice.
 *   3. A female-sounding voice in any language.
 *   4. The browser's first available voice, or undefined.
 */
export function pickPreferredVoice(
  voices: SpeechSynthesisVoice[],
  language: SpeechLanguage
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  if (language === 'hi') {
    const femaleHindi = voices.find((v) => isHindiVoice(v) && nameSuggestsFemale(v.name));
    if (femaleHindi) return femaleHindi;

    const googleHindi = voices.find(isGoogleHindi);
    if (googleHindi) return googleHindi;

    const anyHindi = voices.find(isHindiVoice);
    if (anyHindi) return anyHindi;
  } else {
    const femaleEnglish = voices.find((v) => isEnglishVoice(v) && nameSuggestsFemale(v.name));
    if (femaleEnglish) return femaleEnglish;

    const anyEnglish = voices.find(isEnglishVoice);
    if (anyEnglish) return anyEnglish;
  }

  const anyFemale = voices.find((v) => nameSuggestsFemale(v.name));
  if (anyFemale) return anyFemale;

  return voices[0];
}

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesChangedListenerAttached = false;

/**
 * Loads the list of available voices from `speechSynthesis.getVoices()`,
 * handling the well-known browser quirk (notably Chrome) where this returns
 * an empty array synchronously on first call, with the real list only
 * becoming available asynchronously once the `voiceschanged` event fires.
 *
 * Returns a promise that resolves with whatever voices end up available. If
 * `voiceschanged` never fires (or the browser has zero voices installed),
 * this resolves with an empty array after a short wait rather than hanging
 * forever.
 */
export function loadVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const immediate = synth.getVoices();
  if (immediate && immediate.length > 0) {
    cachedVoices = immediate;
    return Promise.resolve(immediate);
  }

  if (cachedVoices && cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      cachedVoices = voices;
      resolve(voices);
    };

    const handleVoicesChanged = () => {
      const voices = synth.getVoices();
      if (voices && voices.length > 0) {
        finish(voices);
      }
    };

    if (!voicesChangedListenerAttached && 'addEventListener' in synth) {
      synth.addEventListener('voiceschanged', handleVoicesChanged);
      voicesChangedListenerAttached = true;
    } else if ('addEventListener' in synth) {
      // Still attach a one-off listener for this call even if a global
      // listener was already attached previously, so this promise settles.
      synth.addEventListener('voiceschanged', handleVoicesChanged);
    }

    // Fallback: if voiceschanged never fires (some browsers, or zero voices
    // installed), resolve with whatever getVoices() returns after a short
    // wait rather than hanging forever.
    setTimeout(() => {
      finish(synth.getVoices() ?? []);
    }, 300);
  });
}

/**
 * Selects and returns the best-effort preferred voice for the given speech
 * language, handling the async `voiceschanged` loading quirk. Returns
 * undefined if `speechSynthesis` is unavailable or no voices are found,
 * in which case the caller should leave `utterance.voice` unset.
 */
export async function selectPreferredVoice(
  language: SpeechLanguage
): Promise<SpeechSynthesisVoice | undefined> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  try {
    const voices = await loadVoices(window.speechSynthesis);
    return pickPreferredVoice(voices, language);
  } catch {
    return undefined;
  }
}
