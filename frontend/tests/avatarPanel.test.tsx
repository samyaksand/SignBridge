import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarPanel } from '@/components/AvatarPanel';

describe('AvatarPanel', () => {
  it('renders a labeled placeholder avatar, not a real avatar claim', () => {
    render(<AvatarPanel active={false} />);
    expect(screen.getByText(/Avatar placeholder, coming soon/i)).toBeInTheDocument();
  });

  it('renders an svg with an accessible label', () => {
    render(<AvatarPanel active={true} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label');
  });
});
