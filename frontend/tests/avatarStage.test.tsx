import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AvatarStage } from '@/components/avatar/AvatarStage';

describe('AvatarStage', () => {
  it('falls back to the SVG placeholder avatar panel when WebGL is unavailable (real jsdom behavior, not mocked)', async () => {
    // jsdom genuinely has no WebGL context, so getContext('webgl'/'webgl2') returns
    // null here for real, this exercises the real fallback path.
    render(<AvatarStage clipName={null} isPlaying={false} speed={1} hasDemo={false} />);
    await waitFor(() => {
      expect(screen.getByText(/Avatar placeholder, coming soon/i)).toBeInTheDocument();
    });
  });

  it('never renders a Canvas element in an environment without WebGL', async () => {
    const { container } = render(
      <AvatarStage clipName={null} isPlaying={false} speed={1} hasDemo={false} />
    );
    await waitFor(() => {
      expect(screen.getByText(/Avatar placeholder, coming soon/i)).toBeInTheDocument();
    });
    expect(container.querySelector('canvas')).toBeNull();
  });
});
