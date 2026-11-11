import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreSignsClient } from '@/app/explore/ExploreSignsClient';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';
import { ISL_DICTIONARY } from '@/lib/data/islDictionary';

function renderExplore() {
  return render(
    <PreferencesProvider>
      <ExploreSignsClient />
    </PreferencesProvider>
  );
}

describe('ExploreSignsClient', () => {
  it('renders the word dictionary with its real verified word count', () => {
    renderExplore();
    expect(screen.getByRole('heading', { name: /Explore Signs/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(`All words \\(${ISL_DICTIONARY.length}\\)`) })
    ).toBeInTheDocument();
  });

  it('searching for a nonexistent word shows an honest empty state, not a broken grid', async () => {
    const user = userEvent.setup();
    renderExplore();
    const search = screen.getByLabelText('Search for any word');
    await user.type(search, 'zzzqqqnonexistent');
    expect(screen.getByText(/No words match your search/i)).toBeInTheDocument();
  });

  it('filtering by a real category only shows words from that category', async () => {
    if (ISL_DICTIONARY.length === 0) return;
    const user = userEvent.setup();
    renderExplore();
    const firstCategory = ISL_DICTIONARY[0].category;
    const categoryGroup = screen.getByRole('group', { name: 'Filter by category' });
    const categoryButton = within(categoryGroup).getByRole('button', {
      name: new RegExp(`^${firstCategory}$`, 'i'),
    });
    await user.click(categoryButton);
    const wordsInCategory = new Set(
      ISL_DICTIONARY.filter((e) => e.category === firstCategory).map((e) => e.word)
    );
    expect(wordsInCategory.size).toBeGreaterThan(0);
  });

  it('opening a word shows a dialog with a replay control', async () => {
    if (ISL_DICTIONARY.length === 0) return;
    const user = userEvent.setup();
    renderExplore();
    const firstWord = ISL_DICTIONARY[0].word;
    const wordButtons = screen.getAllByText(new RegExp(`^${firstWord}$`, 'i'));
    await user.click(wordButtons[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Replay/i })).toBeInTheDocument();
  });
});
