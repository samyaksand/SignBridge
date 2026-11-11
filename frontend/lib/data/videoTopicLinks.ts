import { ISL_SIGNS, getSignsByCategory, getSignById, type IslSign, type SignCategory } from './islSigns';

/**
 * Shared, honest topic-linking lookup between SignBridge's verified ISL
 * video library (10 real lesson recordings) and the rest of the app's
 * content (communication cards).
 *
 * This module exists to keep every match honest:
 *
 * - A match here means the phrase's TOPIC genuinely overlaps a verified
 *   video's lesson category (greetings / everyday objects / common
 *   conversations), not that the video shows that exact phrase being
 *   signed. The videos are full course lessons, not single-word clips.
 * - Phrases with no genuine topical overlap (most feelings, health
 *   details, basic needs, family requests) are simply left unmapped.
 *   Do not add an entry here "to have something to show": an absent
 *   entry is the honest, correct state for most of the library.
 *
 * Any UI that surfaces a match from here MUST frame it as a related
 * lesson video that touches the topic, not a direct demonstration.
 */

export type VideoTopic = SignCategory;

/**
 * Phrase -> topic. Keyed by the exact English card label used elsewhere
 * in the app (case-sensitive match on the strings already in
 * communicationCards.json), so this list can be audited against that
 * file directly.
 *
 * Reasoning per entry:
 * - "Hello!" -> greetings: the greetings video (isl-2026-day1 / isl-2025-day1)
 *   is literally a lesson on "Initiating conversation in ISL", which is what
 *   a greeting opens. Direct topical match.
 * - "I have a question" -> common conversations: the "Sustaining conversation
 *   in ISL" lessons cover how a conversation continues, which includes
 *   asking something mid-conversation. Genuine topical overlap.
 * - "I need help with this" -> common conversations: same reasoning, asking
 *   for help while talking something through is part of sustaining a
 *   conversation. Not a demonstration of this exact phrase's sign.
 * - "I do not understand" -> common conversations: asking for clarification
 *   is a standard part of sustaining a conversation.
 * - "Please show me again" -> common conversations: same clarification-
 *   request reasoning as above.
 * - "Thank you", "Yes", "No", "I am sorry" -> common conversations: these are
 *   core everyday-conversation words, and the "common conversations"
 *   lessons (sustaining / sharing more) are generally about carrying on
 *   exactly this kind of everyday exchange.
 *
 * Everything else (basic needs, feelings, health/safety specifics, family
 * requests like "please come here", most school-practical phrases) is
 * intentionally left out: there is no genuine topical lesson for them in
 * the current 10-video library.
 */
const PHRASE_TO_TOPIC: Record<string, VideoTopic> = {
  'Hello!': 'greetings',
  'I have a question': 'common conversations',
  'I need help with this': 'common conversations',
  'I do not understand': 'common conversations',
  'Please show me again': 'common conversations',
  'Thank you': 'common conversations',
  Yes: 'common conversations',
  No: 'common conversations',
  'I am sorry': 'common conversations',
};

/** Deterministic small string hash, used only to spread different phrases
 * across the several videos that share a topic category, so two unrelated
 * cards (e.g. "Thank you" and "Yes") do not always surface the literal same
 * video just because they share a topic. Always picking matches[0] would
 * make every "common conversations" phrase (the large majority of matches)
 * resolve to one identical video, which reads as duplicated content even
 * though the underlying topic match is still honest. */
function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Returns a verified video in a topic category, chosen deterministically
 * per lookup key so repeated calls for the same phrase/scenario always
 * return the same video (stable across renders), while different
 * phrases/scenarios in the same category are spread across the category's
 * videos instead of all collapsing onto one. Returns null for an unknown
 * topic or an empty category. */
function videoForTopic(topic: VideoTopic | undefined, key: string): IslSign | null {
  if (!topic) return null;
  const matches = getSignsByCategory(topic);
  if (matches.length === 0) return null;
  return matches[stableHash(key) % matches.length];
}

/** Honest related-video lookup for a communication card label (e.g.
 * "Hello!", "I have a question"). Returns null when there is no genuine
 * topical match, which is the expected, correct result for most phrases
 * in the app. */
export function getRelatedVideoForPhrase(enLabel: string): IslSign | null {
  return videoForTopic(PHRASE_TO_TOPIC[enLabel], enLabel);
}

/** True if a card phrase has a genuine related lesson video. */
export function hasRelatedVideo(enLabel: string): boolean {
  return getRelatedVideoForPhrase(enLabel) !== null;
}

// Re-exported for convenience so callers do not need a second import from
// lib/data/islSigns just to resolve an id back to a full IslSign.
export { getSignById };
export const ALL_VERIFIED_VIDEO_IDS: string[] = ISL_SIGNS.map((s) => s.id);
