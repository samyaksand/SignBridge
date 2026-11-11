import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeafblindGuidePage from '@/app/deafblind-guide/page';

describe('Deafblind caregiver guide page', () => {
  it('renders real, substantial content, not a stub', () => {
    render(<DeafblindGuidePage />);
    expect(
      screen.getByRole('heading', { name: /For deafblind caregivers/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/hand-under-hand/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/identify yourself by touch/i)).toBeInTheDocument();
    expect(screen.getByText(/not a complete tactile ASL or ISL curriculum/i)).toBeInTheDocument();
  });

  it('links back to the homepage', () => {
    render(<DeafblindGuidePage />);
    expect(screen.getByRole('link', { name: /Back to SignBridge home/i })).toHaveAttribute(
      'href',
      '/'
    );
  });
});
