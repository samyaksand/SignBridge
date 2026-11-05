import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentModeClient } from '@/app/parent/ParentModeClient';
import { PracticeListProvider } from '@/lib/context/PracticeListContext';
import { ISL_SIGNS } from '@/lib/data/islSigns';

function renderParentMode() {
  return render(
    <PracticeListProvider>
      <ParentModeClient />
    </PracticeListProvider>
  );
}

describe('ParentModeClient (verified ISL library, no 3D avatar)', () => {
  it('never claims to translate arbitrary text into ISL', () => {
    renderParentMode();
    expect(screen.getByText(/does not translate arbitrary text into ISL/i)).toBeInTheDocument();
  });

  it('shows a fallback message for a search with no match', async () => {
    const user = userEvent.setup();
    renderParentMode();
    const input = screen.getByLabelText('Search the verified sign library');
    await user.type(input, 'zzzznonexistentword');
    expect(screen.getByText(/No verified signs match that search/i)).toBeInTheDocument();
  });

  it('adding a sign to the message renders its real verified video iframe', async () => {
    const user = userEvent.setup();
    renderParentMode();
    const firstSign = ISL_SIGNS[0];
    const signButtons = await screen.findAllByRole('button', { name: new RegExp(firstSign.title, 'i') });
    await user.click(signButtons[0]);

    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null;
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toContain(firstSign.videoId);
  });

  it('clear resets the message', async () => {
    const user = userEvent.setup();
    renderParentMode();
    const firstSign = ISL_SIGNS[0];
    const signButtons = await screen.findAllByRole('button', { name: new RegExp(firstSign.title, 'i') });
    await user.click(signButtons[0]);
    await user.click(screen.getByRole('button', { name: /^Clear$/i }));
    expect(screen.queryByRole('button', { name: /^Speak$/i })).not.toBeInTheDocument();
  });

  it('rapid add/remove of the same sign never crashes and leaves a consistent state', async () => {
    const user = userEvent.setup();
    renderParentMode();
    const firstSign = ISL_SIGNS[0];
    const signButtons = await screen.findAllByRole('button', { name: new RegExp(firstSign.title, 'i') });
    const signButton = signButtons[0];
    await user.click(signButton);
    await user.click(signButton);
    await user.click(signButton);
    // Message signs are additive only (no toggle-off from the card itself),
    // so repeated clicks on the same card should still show exactly one
    // chip for this sign, not three.
    const removeButtons = screen.getAllByLabelText(new RegExp(`Remove ${firstSign.title}`, 'i'));
    expect(removeButtons).toHaveLength(1);
  });
});
