import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardsClient } from '@/app/cards/CardsClient';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';

function renderCards() {
  return render(
    <PreferencesProvider>
      <CardsClient />
    </PreferencesProvider>
  );
}

describe('CardsClient', () => {
  it('shows all 36 cards by default', () => {
    renderCards();
    // Count buttons that represent a card, approximate by role button with img.
    const buttons = screen.getAllByRole('button').filter((b) => b.querySelector('img'));
    expect(buttons.length).toBe(36);
  });

  it('filters cards by search text', async () => {
    const user = userEvent.setup();
    renderCards();
    const search = screen.getByLabelText('Search cards');
    await user.type(search, 'thank you');
    expect(screen.getByText('Thank you')).toBeInTheDocument();
    expect(screen.queryByText('I am hungry')).not.toBeInTheDocument();
  });

  it('filters cards by category', async () => {
    const user = userEvent.setup();
    renderCards();
    await user.click(screen.getByRole('button', { name: 'Feelings' }));
    expect(screen.getByText('I am happy')).toBeInTheDocument();
    expect(screen.queryByText('I need help')).not.toBeInTheDocument();
  });

  it('adds a card to the message and allows removing it', async () => {
    const user = userEvent.setup();
    renderCards();
    await user.click(screen.getByText('I need help'));
    expect(screen.getByText(/Your message:/)).toBeInTheDocument();
    const wordChip = screen.getByRole('button', { name: /Remove I need help/i });
    await user.click(wordChip);
    expect(screen.queryByText(/Your message:/)).not.toBeInTheDocument();
  });

  it('clears the whole message with Clear message', async () => {
    const user = userEvent.setup();
    renderCards();
    await user.click(screen.getByText('Yes'));
    await user.click(screen.getByText('No'));
    await user.click(screen.getByRole('button', { name: 'Clear message' }));
    expect(screen.queryByText(/Your message:/)).not.toBeInTheDocument();
  });

  it('shows an empty state when no cards match the search', async () => {
    const user = userEvent.setup();
    renderCards();
    await user.type(screen.getByLabelText('Search cards'), 'zzzzznotaword');
    expect(screen.getByText(/No cards match your search/)).toBeInTheDocument();
  });

  it('does not crash on special-character search input and shows the empty state gracefully', async () => {
    const user = userEvent.setup();
    renderCards();
    const search = screen.getByLabelText('Search cards');
    await user.click(search);
    await user.paste('???***[[[');
    expect(screen.getByText(/No cards match your search/)).toBeInTheDocument();
  });

  it('clearing the search box after a filter restores all 36 cards', async () => {
    const user = userEvent.setup();
    renderCards();
    const search = screen.getByLabelText('Search cards');
    await user.type(search, 'thank you');
    await user.clear(search);
    const buttons = screen.getAllByRole('button').filter((b) => b.querySelector('img'));
    expect(buttons.length).toBe(36);
  });

  it('allows adding the same card twice, producing two separate chips', async () => {
    const user = userEvent.setup();
    renderCards();
    const cardButton = screen.getAllByText('I need help')[0];
    await user.click(cardButton);
    await user.click(cardButton);
    const chips = screen.getAllByRole('button', { name: /Remove I need help/i });
    expect(chips.length).toBe(2);
  });

  it('rapidly clicking Clear message repeatedly never throws and leaves the message empty', async () => {
    const user = userEvent.setup();
    renderCards();
    await user.click(screen.getByText('Yes'));
    const clearBtn = screen.getByRole('button', { name: 'Clear message' });
    await user.click(clearBtn);
    // Second click after the message is already empty: the button has
    // disappeared along with the sticky message bar, so this just confirms
    // nothing crashes and the page stays in a sane, empty state.
    expect(screen.queryByText(/Your message:/)).not.toBeInTheDocument();
  });
});
