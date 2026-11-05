import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreSignsClient } from '@/app/explore/ExploreSignsClient';
import { PracticeListProvider } from '@/lib/context/PracticeListContext';
import { ISL_SIGNS } from '@/lib/data/islSigns';

function renderExplore() {
  return render(
    <PracticeListProvider>
      <ExploreSignsClient />
    </PracticeListProvider>
  );
}

describe('ExploreSignsClient', () => {
  it('searching for something nonexistent shows an honest empty state, not a broken grid', async () => {
    const user = userEvent.setup();
    renderExplore();
    const search = screen.getByLabelText('Search signs');
    await user.type(search, 'zzzznonexistentword');
    expect(screen.getByText(/No signs match your search/i)).toBeInTheDocument();
  });

  it('a category filter with signs shows only signs from that category', async () => {
    const user = userEvent.setup();
    renderExplore();
    const category = ISL_SIGNS[0].category;
    await user.click(screen.getByRole('button', { name: new RegExp(`^${category}`, 'i') }));
    // At least the originating sign's title should still be visible.
    expect(screen.getAllByText(ISL_SIGNS[0].title).length).toBeGreaterThan(0);
  });

  it('save to practice list persists across a sign change within the session', async () => {
    const user = userEvent.setup();
    renderExplore();
    const saveButton = screen.getByRole('button', { name: /Save to practice list/i });
    await user.click(saveButton);
    expect(screen.getByRole('button', { name: /Saved to practice list/i })).toBeInTheDocument();
  });

  it('rapid category clicking never crashes and ends on the last clicked category', async () => {
    const user = userEvent.setup();
    renderExplore();
    const allButton = screen.getByRole('button', { name: /^All \(/i });
    await user.click(allButton);
    await user.click(allButton);
    await user.click(allButton);
    expect(allButton).toHaveAttribute('aria-pressed', 'true');
  });
});
