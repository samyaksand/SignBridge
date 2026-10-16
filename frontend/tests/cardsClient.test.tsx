import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardsClient } from '@/app/cards/CardsClient';

describe('CardsClient', () => {
  it('shows all 36 cards by default', () => {
    render(<CardsClient />);
    // Count buttons that represent a card, approximate by role button with img.
    const buttons = screen.getAllByRole('button').filter((b) => b.querySelector('img'));
    expect(buttons.length).toBe(36);
  });

  it('filters cards by search text', async () => {
    const user = userEvent.setup();
    render(<CardsClient />);
    const search = screen.getByLabelText('Search cards');
    await user.type(search, 'thank you');
    expect(screen.getByText('Thank you')).toBeInTheDocument();
    expect(screen.queryByText('I am hungry')).not.toBeInTheDocument();
  });

  it('filters cards by category', async () => {
    const user = userEvent.setup();
    render(<CardsClient />);
    await user.click(screen.getByRole('button', { name: 'Feelings' }));
    expect(screen.getByText('I am happy')).toBeInTheDocument();
    expect(screen.queryByText('I need help')).not.toBeInTheDocument();
  });

  it('adds a card to the message and allows removing it', async () => {
    const user = userEvent.setup();
    render(<CardsClient />);
    await user.click(screen.getByText('I need help'));
    expect(screen.getByText(/Your message:/)).toBeInTheDocument();
    const wordChip = screen.getByRole('button', { name: /Remove I need help/i });
    await user.click(wordChip);
    expect(screen.queryByText(/Your message:/)).not.toBeInTheDocument();
  });

  it('clears the whole message with Clear message', async () => {
    const user = userEvent.setup();
    render(<CardsClient />);
    await user.click(screen.getByText('Yes'));
    await user.click(screen.getByText('No'));
    await user.click(screen.getByRole('button', { name: 'Clear message' }));
    expect(screen.queryByText(/Your message:/)).not.toBeInTheDocument();
  });

  it('shows an empty state when no cards match the search', async () => {
    const user = userEvent.setup();
    render(<CardsClient />);
    await user.type(screen.getByLabelText('Search cards'), 'zzzzznotaword');
    expect(screen.getByText(/No cards match your search/)).toBeInTheDocument();
  });
});
