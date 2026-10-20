import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';

function renderHome() {
  return render(
    <PreferencesProvider>
      <Home />
    </PreferencesProvider>
  );
}

describe('Home page communication mode wiring', () => {
  it('highlights the mode-entry card(s) matching the selected communication style', async () => {
    const user = userEvent.setup();
    renderHome();

    const cardsLink = screen.getByRole('link', { name: 'Browse cards' });
    const cardsCard = cardsLink.closest('[data-highlighted]');
    expect(cardsCard).toHaveAttribute('data-highlighted', 'false');

    await user.click(screen.getByRole('radio', { name: /Picture cards/i }));

    expect(cardsCard).toHaveAttribute('data-highlighted', 'true');
  });

  it('reflects the selected communication mode in the hero visual', async () => {
    const user = userEvent.setup();
    renderHome();

    const signsChip = screen.getByText('Signs').closest('[data-active]');
    const picturesChip = screen.getByText('Pictures').closest('[data-active]');

    // Default mode is "combination", so every chip starts active.
    expect(signsChip).toHaveAttribute('data-active', 'true');
    expect(picturesChip).toHaveAttribute('data-active', 'true');

    await user.click(screen.getByRole('radio', { name: /ISL references/i }));

    expect(signsChip).toHaveAttribute('data-active', 'true');
    expect(picturesChip).toHaveAttribute('data-active', 'false');
  });
});
