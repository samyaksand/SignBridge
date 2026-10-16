import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FamilyPracticeClient } from '@/app/family-practice/FamilyPracticeClient';

describe('FamilyPracticeClient', () => {
  it('completes the "I need help" scenario end to end', async () => {
    const user = userEvent.setup();
    render(<FamilyPracticeClient />);

    await user.click(screen.getByRole('button', { name: 'Start this scenario' }));
    expect(screen.getByText(/What is happening/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /let's go/i }));
    expect(screen.getByText(/For the parent/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ready for the child/i }));
    expect(screen.getByText(/For the child/i)).toBeInTheDocument();

    // Pick the correct card (basic-01 -> "I need help")
    const options = screen.getAllByRole('button', { name: /I need help|I need a break|I need a doctor|Please wait/i });
    const correctOption = options.find((o) => o.textContent?.includes('I need help'));
    expect(correctOption).toBeTruthy();
    await user.click(correctOption!);
    await user.click(screen.getByRole('button', { name: 'Confirm choice' }));

    expect(screen.getByText(/Confirm together/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /that is right/i }));

    expect(screen.getByText(/All done!/i)).toBeInTheDocument();
  });
});
