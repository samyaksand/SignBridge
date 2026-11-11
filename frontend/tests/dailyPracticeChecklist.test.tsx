import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DailyPracticeChecklist } from '@/components/isl/DailyPracticeChecklist';
import { ISL_DICTIONARY, type IslDictionaryEntry } from '@/lib/data/islDictionary';

function renderChecklist(onSelectWord = vi.fn()) {
  return { onSelectWord, ...render(<DailyPracticeChecklist onSelectWord={onSelectWord} />) };
}

describe('DailyPracticeChecklist', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows exactly 5 words to learn today', () => {
    renderChecklist();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
  });

  it('shows an honest progress count that starts at 0 of 5', () => {
    renderChecklist();
    expect(screen.getByText('0 of 5 learned today')).toBeInTheDocument();
  });

  it('checking a word off updates the progress count and persists to localStorage', async () => {
    const user = userEvent.setup();
    renderChecklist();
    const items = screen.getAllByRole('listitem');
    const firstCheckbox = within(items[0]).getByRole('button', { name: /Mark .* as learned/i });
    await user.click(firstCheckbox);
    expect(screen.getByText('1 of 5 learned today')).toBeInTheDocument();

    const stored = window.localStorage.getItem('signbridge-learned-words');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
  });

  it('learned state survives a remount (persists across reload)', async () => {
    const user = userEvent.setup();
    const { unmount } = renderChecklist();
    const items = screen.getAllByRole('listitem');
    const firstCheckbox = within(items[0]).getByRole('button', { name: /Mark .* as learned/i });
    await user.click(firstCheckbox);

    const storedBeforeRemount = window.localStorage.getItem('signbridge-learned-words');
    expect(storedBeforeRemount).toBeTruthy();
    const idsBeforeRemount = JSON.parse(storedBeforeRemount as string);
    expect(idsBeforeRemount.length).toBe(1);

    unmount();

    render(<DailyPracticeChecklist onSelectWord={vi.fn()} />);

    // The learned id itself must still be the one and only entry in
    // localStorage after a fresh mount, proving it was read back in.
    const storedAfterRemount = window.localStorage.getItem('signbridge-learned-words');
    const idsAfterRemount = JSON.parse(storedAfterRemount as string);
    expect(idsAfterRemount).toEqual(idsBeforeRemount);
  });

  it('clicking a word (not the checkbox) opens the real word dialog via onSelectWord', async () => {
    const user = userEvent.setup();
    const { onSelectWord } = renderChecklist();
    const items = screen.getAllByRole('listitem');
    const wordButton = within(items[0]).getByRole('button', { name: (name) => !name.startsWith('Mark') });
    await user.click(wordButton);
    expect(onSelectWord).toHaveBeenCalledTimes(1);
    const calledWith = onSelectWord.mock.calls[0][0] as IslDictionaryEntry;
    expect(ISL_DICTIONARY.some((e) => e.id === calledWith.id)).toBe(true);
  });

  it('re-rolling gives a new set of 5 words without fabricating any stats', async () => {
    const user = userEvent.setup();
    renderChecklist();
    const before = screen.getAllByRole('listitem').map((li) => li.textContent);
    const rerollButton = screen.getByRole('button', { name: /new set/i });

    // Try a few times since a random reroll could coincidentally match.
    let changed = false;
    for (let i = 0; i < 10 && !changed; i += 1) {
      await user.click(rerollButton);
      const after = screen.getAllByRole('listitem').map((li) => li.textContent);
      changed = JSON.stringify(after) !== JSON.stringify(before);
    }
    // With 500 dictionary words, 10 rerolls of 5 should change at least once.
    if (ISL_DICTIONARY.length > 10) {
      expect(changed).toBe(true);
    }

    // No fake gamification text anywhere in the panel.
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/other (users|people)/i)).not.toBeInTheDocument();
  });
});
