import { describe, expect, it, vi, afterEach } from 'vitest';
import { requestSentenceSuggestions } from '@/lib/suggestions/requestSuggestions';

describe('requestSentenceSuggestions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends only the confirmed word list and output language, nothing else', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: ['I need help'], used_requesty: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await requestSentenceSuggestions(['help', 'water'], 'en');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/suggestions$/);
    const sentBody = JSON.parse(options.body);
    expect(sentBody).toEqual({ confirmed_words: ['help', 'water'], output_language: 'en' });
    // Explicitly confirm no other keys snuck in (e.g. no landmarks/frames/video).
    expect(Object.keys(sentBody).sort()).toEqual(['confirmed_words', 'output_language']);
  });

  it('degrades gracefully when the backend is unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await requestSentenceSuggestions(['help'], 'en');

    expect(result.ok).toBe(false);
    expect(result.suggestions).toEqual([]);
    expect(result.message).toBeTruthy();
  });

  it('degrades gracefully on a non-ok HTTP response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await requestSentenceSuggestions(['help'], 'en');

    expect(result.ok).toBe(false);
    expect(result.suggestions).toEqual([]);
  });

  it('returns an unavailable result without calling fetch for an empty word list', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await requestSentenceSuggestions([], 'en');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});
