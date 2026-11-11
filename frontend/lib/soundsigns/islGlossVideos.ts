// Maps an ISL gloss word to a real, verified video clip file copied from the
// originally vendored SoundSigns frontend's public/videos folder (that
// vendored app has since been deleted; see docs/SOUNDSIGNS.md) into this
// app's own static assets at public/soundsigns-videos. Mirrors the matching
// logic in that vendored app's own videoUtils.js: words get their
// own clip when one exists for the exact word, single letters and digits
// have their own letter/number clips, and anything without a real file is
// reported honestly instead of guessed or silently skipped.

export const SOUNDSIGNS_VIDEO_BASE = '/soundsigns-videos';

// The real set of word clips copied into public/soundsigns-videos/words,
// taken from the originally vendored SoundSigns frontend's own
// wordDatabase.js. Keeping an explicit list here (rather than probing the
// filesystem at runtime) means this file never claims a clip exists that
// was not actually copied.
export const KNOWN_WORD_CLIPS = [
  'After', 'Again', 'Against', 'Age', 'All', 'Alone', 'Also', 'And', 'Ask', 'At',
  'Be', 'Beautiful', 'Before', 'Best', 'Better', 'Busy', 'But', 'Bye', 'Can', 'Cannot',
  'Change', 'College', 'Come', 'Computer', 'Day', 'Distance', 'Do', 'Do Not', 'Does Not',
  'Eat', 'Engineer', 'Fight', 'Finish', 'From', 'Glitter', 'Go', 'God', 'Gold', 'Good',
  'Great', 'Hand', 'Hands', 'Happy', 'Hello', 'Help', 'Her', 'Here', 'His', 'Home',
  'Homepage', 'How', 'Invent', 'It', 'Keep', 'Language', 'Laugh', 'Learn', 'Me', 'More',
  'My', 'Name', 'Next', 'Not', 'Now', 'Of', 'On', 'Our', 'Out', 'Pretty', 'Right', 'Sad',
  'Safe', 'See', 'Self', 'Sign', 'Sing', 'So', 'Sound', 'Stay', 'Study', 'Talk',
  'Television', 'Thank', 'Thank You', 'That', 'They', 'This', 'Those', 'Time', 'To',
  'Type', 'Us', 'Walk', 'Wash', 'Way', 'We', 'Welcome', 'What', 'When', 'Where', 'Which',
  'Who', 'Whole', 'Whose', 'Why', 'Will', 'With', 'Without', 'Words', 'Work', 'World',
  'Wrong', 'You', 'Your', 'Yourself',
] as const;

const WORD_LOOKUP = new Map(KNOWN_WORD_CLIPS.map((w) => [w.toLowerCase(), w]));

export interface GlossClip {
  /** The cleaned word or letter/digit this clip represents. */
  text: string;
  /** What to show in the sequence chip. */
  display: string;
  /** Real, resolvable path under /public, or null when no clip exists. */
  src: string | null;
}

/**
 * Splits a raw ISL gloss string into individual clip lookups. Each entry
 * carries a real src path only when a matching file actually exists on
 * disk; a gloss word with no real match gets src: null so the player can
 * show an honest "no video for this word" note instead of skipping it.
 */
export function resolveGlossClips(gloss: string): GlossClip[] {
  const words = gloss
    .replace(/"/g, '')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const clips: GlossClip[] = [];

  for (const rawWord of words) {
    const cleaned = rawWord.replace(/[.,!?;"']/g, '');
    if (!cleaned) continue;

    const parts = cleaned.includes('-')
      ? cleaned.split('-').filter(Boolean)
      : [cleaned];

    for (const part of parts) {
      if (/^\d+$/.test(part)) {
        for (const digit of part.split('')) {
          clips.push({
            text: digit,
            display: digit,
            src: `${SOUNDSIGNS_VIDEO_BASE}/numbers/${digit}.mp4`,
          });
        }
        continue;
      }

      const matchedWord = WORD_LOOKUP.get(part.toLowerCase());
      if (matchedWord) {
        clips.push({
          text: matchedWord,
          display: matchedWord,
          src: `${SOUNDSIGNS_VIDEO_BASE}/words/${matchedWord}.mp4`,
        });
        continue;
      }

      // No real word clip: fall back to letter-by-letter, same as the
      // vendored app, each letter backed by a real letter clip.
      for (const letter of part) {
        if (/^[a-zA-Z]$/.test(letter)) {
          const upper = letter.toUpperCase();
          clips.push({
            text: upper,
            display: upper,
            src: `${SOUNDSIGNS_VIDEO_BASE}/letters/${upper}.mp4`,
          });
        } else {
          // Not a letter, digit, or known word: honestly report no clip.
          clips.push({ text: part, display: part, src: null });
          break;
        }
      }
    }
  }

  return clips;
}
