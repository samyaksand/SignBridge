import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/Footer';

describe('Footer', () => {
  it('shows the real credit line with working GitHub and LinkedIn links', () => {
    render(<Footer />);
    expect(screen.getByText(/Built with/i)).toBeInTheDocument();
    expect(screen.getByText(/Samyak Sanjay Sand/i)).toBeInTheDocument();

    const github = screen.getByRole('link', { name: 'GitHub' });
    expect(github).toHaveAttribute('href', 'https://github.com/samyaksand/SignBridge');
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(github).toHaveAttribute('rel', expect.stringContaining('noreferrer'));

    const linkedin = screen.getByRole('link', { name: 'LinkedIn' });
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/samyak-sand/');
    expect(linkedin).toHaveAttribute('target', '_blank');
    expect(linkedin).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(linkedin).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });
});
