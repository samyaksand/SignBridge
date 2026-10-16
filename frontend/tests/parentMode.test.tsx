import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentModeClient } from '@/app/parent/ParentModeClient';

describe('ParentModeClient', () => {
  it('shows a fallback message for text with no curated demo', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    const input = screen.getByLabelText('Message to show in ISL');
    await user.type(input, 'some random sentence nobody has recorded');
    await user.click(screen.getByRole('button', { name: /Show in ISL/i }));
    expect(screen.getByText(/Sign demonstration not yet available/i)).toBeInTheDocument();
  });

  it('shows a demo reference when text matches a curated phrase via Quick Messages', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    await user.click(screen.getByRole('button', { name: 'I need help' }));
    expect(screen.getByText(/placeholder reference demonstration/i)).toBeInTheDocument();
  });

  it('clear resets the message and playback state', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    await user.click(screen.getByRole('button', { name: 'I need help' }));
    await user.click(screen.getByRole('button', { name: /Clear/i }));
    expect(screen.queryByText(/placeholder reference demonstration/i)).not.toBeInTheDocument();
  });
});
