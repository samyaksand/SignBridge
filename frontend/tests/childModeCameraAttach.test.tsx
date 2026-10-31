import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChildModeClient } from '@/app/child/ChildModeClient';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';

function renderChildMode() {
  return render(
    <PreferencesProvider>
      <ChildModeClient />
    </PreferencesProvider>
  );
}

describe('ChildModeClient camera stream attachment (regression)', () => {
  // Regression test for a real reported bug: starting the camera requested
  // permission and got a real MediaStream back, but the preview never showed
  // video. Root cause: the <video> element is only rendered once cameraOn is
  // true, so the ref was still null at the moment the stream resolved, and
  // the stream was silently dropped on the floor instead of attached.
  it('attaches the resolved MediaStream to the video element srcObject', async () => {
    const user = userEvent.setup();
    const fakeStream = { getTracks: () => [] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    renderChildMode();
    await user.click(screen.getByRole('button', { name: /Start Camera/i }));

    await waitFor(() => {
      const video = screen.getByLabelText('Camera preview') as HTMLVideoElement;
      expect(video.srcObject).toBe(fakeStream);
    });
  });

  it('reports camera as unavailable gracefully when getUserMedia itself is missing (no mediaDevices support)', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
    });

    renderChildMode();
    await user.click(screen.getByRole('button', { name: /Start Camera/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not turn on the camera/i)).toBeInTheDocument();
    });
  });
});
