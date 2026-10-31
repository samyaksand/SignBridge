import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock LazyAvatarStage so this test asserts exactly what props
// ParentModeClient resolves and hands down when a Quick Message is clicked,
// without needing a real WebGL context or GLB fetch. This is the wiring the
// reported "avatar doesn't render" bug lives or dies on: if clipName/hasDemo
// are wrong here, the 3D stage would never even attempt to play the right
// clip no matter how AvatarStage itself behaves.
vi.mock('@/components/avatar/LazyAvatarStage', () => ({
  LazyAvatarStage: (props: { clipName: string | null; isPlaying: boolean; hasDemo: boolean }) => (
    <div
      data-testid="avatar-stage-mock"
      data-clip-name={props.clipName ?? ''}
      data-is-playing={String(props.isPlaying)}
      data-has-demo={String(props.hasDemo)}
    />
  ),
}));

import { ParentModeClient } from '@/app/parent/ParentModeClient';

describe('ParentModeClient avatar wiring (regression)', () => {
  it('resolves and passes the correct clipName and hasDemo for a curated Quick Message', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);

    await user.click(screen.getByRole('button', { name: 'I need help' }));

    const stage = screen.getByTestId('avatar-stage-mock');
    expect(stage).toHaveAttribute('data-clip-name', 'gesture_self_point_pulse');
    expect(stage).toHaveAttribute('data-has-demo', 'true');
  });

  it('passes a null clipName and hasDemo=false for text with no curated match, never fabricating a demo', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);

    const input = screen.getByLabelText('Message to show in ISL');
    await user.type(input, 'some totally unrecorded sentence');
    await user.click(screen.getByRole('button', { name: /Show in ISL/i }));

    const stage = screen.getByTestId('avatar-stage-mock');
    expect(stage).toHaveAttribute('data-clip-name', '');
    expect(stage).toHaveAttribute('data-has-demo', 'false');
  });

  it('matches a typed phrase against the curated animation list even when it is not a literal Quick Card, case/whitespace-insensitively (regression)', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);

    // "I am sorry" is in SIGN_ANIMATION_MAP but is not one of the Quick
    // Messages buttons and is not in communicationCards.json either, so the
    // old lookup (which only ever checked communicationCards.json) would
    // always report "not yet available" for it even though an animation
    // exists.
    const input = screen.getByLabelText('Message to show in ISL');
    await user.type(input, '  I Am Sorry  ');
    await user.click(screen.getByRole('button', { name: /Show in ISL/i }));

    const stage = screen.getByTestId('avatar-stage-mock');
    expect(stage).toHaveAttribute('data-clip-name', 'gesture_bow_apologetic');
    expect(stage).toHaveAttribute('data-has-demo', 'true');
  });

  it('only sets isPlaying true after the user presses Play, never autoplaying on message select', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);

    await user.click(screen.getByRole('button', { name: 'I need help' }));
    const stage = screen.getByTestId('avatar-stage-mock');
    expect(stage).toHaveAttribute('data-is-playing', 'false');

    await user.click(screen.getByRole('button', { name: 'Play' }));
    expect(stage).toHaveAttribute('data-is-playing', 'true');
  });
});
