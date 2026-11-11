import { describe, expect, it } from 'vitest';
import { getRelatedVideoForPhrase, hasRelatedVideo } from '@/lib/data/videoTopicLinks';
import { ISL_SIGNS } from '@/lib/data/islSigns';

describe('videoTopicLinks (shared honest topic-matching lookup)', () => {
  it('links "Hello!" to a real greetings video', () => {
    const video = getRelatedVideoForPhrase('Hello!');
    expect(video).not.toBeNull();
    expect(video?.category).toBe('greetings');
    expect(ISL_SIGNS.some((s) => s.id === video?.id)).toBe(true);
  });

  it('links "I have a question" to a real common conversations video', () => {
    const video = getRelatedVideoForPhrase('I have a question');
    expect(video).not.toBeNull();
    expect(video?.category).toBe('common conversations');
  });

  it('links "I do not understand" to a real common conversations video', () => {
    const video = getRelatedVideoForPhrase('I do not understand');
    expect(video).not.toBeNull();
    expect(video?.category).toBe('common conversations');
  });

  it('returns null for phrases with no genuine topical overlap (e.g. specific feelings and health terms)', () => {
    expect(getRelatedVideoForPhrase('I am angry')).toBeNull();
    expect(getRelatedVideoForPhrase('My head hurts')).toBeNull();
    expect(getRelatedVideoForPhrase('I need water')).toBeNull();
    expect(getRelatedVideoForPhrase('Please come here')).toBeNull();
  });

  it('hasRelatedVideo agrees with getRelatedVideoForPhrase', () => {
    expect(hasRelatedVideo('Hello!')).toBe(true);
    expect(hasRelatedVideo('I am angry')).toBe(false);
  });

  it('never returns a video id that is not in the real verified library', () => {
    for (const phrase of ['Hello!', 'I have a question', 'I need help with this', 'Yes', 'No', 'Thank you']) {
      const video = getRelatedVideoForPhrase(phrase);
      if (video) {
        expect(ISL_SIGNS.some((s) => s.id === video.id)).toBe(true);
      }
    }
  });
});
