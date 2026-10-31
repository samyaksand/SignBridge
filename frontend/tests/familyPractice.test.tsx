import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FamilyPracticeClient } from '@/app/family-practice/FamilyPracticeClient';

describe('FamilyPracticeClient', () => {
  it('completes the "I need help" scenario end to end', async () => {
    const user = userEvent.setup();
    render(<FamilyPracticeClient />);

    const scenarioHeading = screen.getByRole('heading', { name: 'I need help' });
    const scenarioCard = scenarioHeading.closest('div');
    await user.click(
      (scenarioCard ?? document.body).querySelector('button') as HTMLElement
    );
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

  it('lists at least 4 distinct scenarios on the picker screen (regression: used to be only 1)', () => {
    render(<FamilyPracticeClient />);
    const startButtons = screen.getAllByRole('button', { name: 'Start this scenario' });
    expect(startButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('choosing the wrong card shows a try-again note and does not advance or dead-end the flow', async () => {
    const user = userEvent.setup();
    render(<FamilyPracticeClient />);

    const scenarioHeading = screen.getByRole('heading', { name: 'I need help' });
    const scenarioCard = scenarioHeading.closest('div');
    await user.click((scenarioCard ?? document.body).querySelector('button') as HTMLElement);
    await user.click(screen.getByRole('button', { name: /let's go/i }));
    await user.click(screen.getByRole('button', { name: /Ready for the child/i }));

    // Pick a wrong option on purpose.
    const options = screen.getAllByRole('button', { name: /I need help|I need a break|I need a doctor|Please wait/i });
    const wrongOption = options.find((o) => !o.textContent?.includes('I need help'));
    expect(wrongOption).toBeTruthy();
    await user.click(wrongOption!);
    await user.click(screen.getByRole('button', { name: 'Confirm choice' }));

    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    // Still on the child-practice step, not stuck or advanced incorrectly.
    expect(screen.getByText(/For the child/i)).toBeInTheDocument();

    // Now choose correctly and confirm the flow can still complete.
    const correctOption = screen
      .getAllByRole('button', { name: /I need help|I need a break|I need a doctor|Please wait/i })
      .find((o) => o.textContent?.includes('I need help'));
    await user.click(correctOption!);
    await user.click(screen.getByRole('button', { name: 'Confirm choice' }));
    expect(screen.getByText(/Confirm together/i)).toBeInTheDocument();
  });

  it('Start over returns to the scenario picker from any step', async () => {
    const user = userEvent.setup();
    render(<FamilyPracticeClient />);

    const scenarioHeading = screen.getByRole('heading', { name: 'I am sad' });
    const scenarioCard = scenarioHeading.closest('div');
    await user.click((scenarioCard ?? document.body).querySelector('button') as HTMLElement);
    expect(screen.getByText(/What is happening/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Start over/i }));
    expect(screen.getAllByRole('button', { name: 'Start this scenario' }).length).toBeGreaterThanOrEqual(4);
  });
});
