import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeExplorePreview } from '@/components/isl/HomeExplorePreview';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';

function renderPreview() {
  return render(
    <PreferencesProvider>
      <HomeExplorePreview />
    </PreferencesProvider>
  );
}

describe('HomeExplorePreview phrase packs', () => {
  it('shows the phrase pack chips alongside the starter grid', () => {
    renderPreview();
    const group = screen.getByRole('group', { name: 'Phrase packs' });
    expect(screen.getByRole('button', { name: 'Daily needs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Feelings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bedtime' })).toBeInTheDocument();
    expect(group).toBeInTheDocument();
  });

  it('defaults to the starter word set with no pack selected', () => {
    renderPreview();
    expect(screen.getByText('Eat')).toBeInTheDocument();
    expect(screen.getByText('Love')).toBeInTheDocument();
  });

  it('clicking a pack chip swaps the shown words to that pack, reusing the same grid', async () => {
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: 'Daily needs' }));
    expect(screen.getByText('Drink')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Feelings' }));
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Sad')).toBeInTheDocument();
  });

  it('clicking the active pack again returns to the default starter set', async () => {
    const user = userEvent.setup();
    renderPreview();

    const dailyNeeds = screen.getByRole('button', { name: 'Daily needs' });
    await user.click(dailyNeeds);
    expect(dailyNeeds).toHaveAttribute('aria-pressed', 'true');

    await user.click(dailyNeeds);
    expect(dailyNeeds).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Eat')).toBeInTheDocument();
  });

  it('extends the attribution line with an honest consent-basis clause', () => {
    renderPreview();
    expect(screen.getByText(/not from a community consent process/i)).toBeInTheDocument();
  });
});
