import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Nav } from '@/components/Nav';

// next/script's real implementation caches loaded scripts by src at the
// module level (ScriptCache/LoadCache) and appends real <script> elements
// to document.body outside the React tree, which makes jsdom-based tests
// that dispatch real DOM 'load' events flaky across test cases in the same
// file. This component only needs next/script to call onLoad once the
// browser would have loaded the CDN script, so a minimal, controllable
// stand-in is enough to exercise the real loading/failure logic
// deterministically, without depending on next/script's own caching.
let pendingLoads: Array<() => void> = [];
vi.mock('next/script', () => ({
  default: ({ onLoad }: { onLoad?: () => void }) => {
    if (onLoad) pendingLoads.push(onLoad);
    return null;
  },
}));

const { FishAslDemoClient } = await import('@/app/asl-fingerspelling-demo/FishAslDemoClient');

const FAKE_LANDMARKS = Array.from({ length: 21 }, (_, i) => ({
  x: 0.1 * i,
  y: 0.2 * i,
  z: 0.01 * i,
}));

function stubMediapipeHands() {
  const handsInstance = {
    setOptions: vi.fn(),
    onResults: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
  };
  const HandsCtor = vi.fn().mockImplementation(() => handsInstance);
  vi.stubGlobal('Hands', HandsCtor);
  return handsInstance;
}

function stubTf(predictedProbs: number[]) {
  const dispose = vi.fn();
  const tfStub = {
    loadLayersModel: vi.fn().mockResolvedValue({
      predict: vi.fn().mockReturnValue({ dataSync: () => Float32Array.from(predictedProbs) }),
      dispose,
    }),
    tensor2d: vi.fn().mockReturnValue({ dataSync: () => Float32Array.from(predictedProbs) }),
    tidy: vi.fn((fn: () => void) => fn()),
  };
  vi.stubGlobal('tf', tfStub);
  return tfStub;
}

/** Fires every onLoad callback registered by the mocked next/script so far. */
function fireAllScriptLoads() {
  const loads = pendingLoads;
  pendingLoads = [];
  act(() => {
    loads.forEach((fn) => fn());
  });
}

describe('FishAslDemoClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    pendingLoads = [];
  });

  it('shows a loading state before the CDN scripts have loaded, and never auto-starts the camera', () => {
    render(<FishAslDemoClient />);
    expect(screen.getByText(/Loading hand-tracking and letter model/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start camera/i })).not.toBeInTheDocument();
  });

  it('calls window.Hands and window.tf.loadLayersModel from the shipped model path once scripts load', async () => {
    const handsInstance = stubMediapipeHands();
    const tfStub = stubTf(new Array(26).fill(0));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ 0: 'A' }) }));

    render(<FishAslDemoClient />);
    fireAllScriptLoads();

    await waitFor(() => {
      expect(tfStub.loadLayersModel).toHaveBeenCalledWith('/asl-fingerspelling-model/model.json');
    });
    expect(handsInstance.setOptions).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start camera/i })).toBeInTheDocument();
    });
  });

  it('starts the camera only on explicit user action and shows a live detected letter readout', async () => {
    const handsInstance = stubMediapipeHands();
    const probs = new Array(26).fill(0);
    probs[0] = 0.99; // index 0 -> label "A"
    stubTf(probs);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ 0: 'A' }) }));

    const getUserMediaMock = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
    });

    render(<FishAslDemoClient />);
    fireAllScriptLoads();

    const startButton = await screen.findByRole('button', { name: /start camera/i });
    expect(getUserMediaMock).not.toHaveBeenCalled();

    const user = userEvent.setup();
    await user.click(startButton);

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: /stop camera/i })).toBeInTheDocument();

    // Simulate MediaPipe Hands delivering a frame with a confident, stable
    // letter. Take the last registered onResults callback, since React can
    // invoke setup effects more than once in test rendering.
    const lastCallIndex = handsInstance.onResults.mock.calls.length - 1;
    const onResultsCallback = handsInstance.onResults.mock.calls[lastCallIndex]?.[0];
    expect(onResultsCallback).toBeTypeOf('function');
    act(() => {
      for (let i = 0; i < 10; i++) {
        onResultsCallback({ multiHandLandmarks: [FAKE_LANDMARKS] });
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Detected letter/i)).toBeInTheDocument();
    });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 99\.0%/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /stop camera/i }));
    expect(screen.getByRole('button', { name: /start camera/i })).toBeInTheDocument();
  });

  it('shows a "no hand" message instead of a fabricated letter when no hand is in frame', async () => {
    const handsInstance = stubMediapipeHands();
    stubTf(new Array(26).fill(0));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ 0: 'A' }) }));
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
      configurable: true,
    });

    render(<FishAslDemoClient />);
    fireAllScriptLoads();

    const startButton = await screen.findByRole('button', { name: /start camera/i });
    const user = userEvent.setup();
    await user.click(startButton);

    await waitFor(() => expect(handsInstance.onResults).toHaveBeenCalled());
    const lastCallIndex = handsInstance.onResults.mock.calls.length - 1;
    const onResultsCallback = handsInstance.onResults.mock.calls[lastCallIndex]?.[0];
    act(() => {
      onResultsCallback({ multiHandLandmarks: [] });
    });

    await waitFor(() => {
      expect(screen.getByText(/No hand detected/i)).toBeInTheDocument();
    });
  });

  it('shows an honest failure message with a retry option when a CDN script fails to load', async () => {
    vi.stubGlobal('Hands', undefined);
    vi.stubGlobal('tf', undefined);

    render(<FishAslDemoClient />);
    // Neither window.Hands nor window.tf ever becomes available, the real
    // failure path this component takes when a CDN script errors out or is
    // blocked: initMediapipe and initModel both bail out and leave their
    // state as 'loading' or 'failed' rather than fabricating readiness.
    fireAllScriptLoads();

    await waitFor(() => {
      expect(screen.getByText(/model failed to load/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('becomes ready even if the CDN scripts were already loaded earlier and onLoad never fires again', async () => {
    // Regression test for a real bug: next/script tracks each <script src>
    // as loaded for the whole page session, not per component mount. If the
    // user already visited this page (or any other page that loaded the
    // same CDN script) earlier in the session, next/script will not call
    // onLoad again, since from its own point of view the script already
    // loaded. Reproduce that exact situation: window.Hands and window.tf
    // are already defined when this component mounts, but onLoad is never
    // invoked (fireAllScriptLoads is deliberately not called).
    stubMediapipeHands();
    stubTf(new Array(26).fill(0));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ 0: 'A' }) }));

    render(<FishAslDemoClient />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start camera/i })).toBeInTheDocument();
    });
  });

  it('does not show the removed third-party license disclosure text on the page', () => {
    render(<FishAslDemoClient />);
    expect(screen.queryByText(/No LICENSE file was found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Experimental, third-party demo\./i)).not.toBeInTheDocument();
  });

  it('adds the Letter Lens entry to the main nav bar', () => {
    render(<Nav />);
    const link = screen.getByRole('link', { name: /letter lens/i });
    expect(link).toHaveAttribute('href', '/asl-fingerspelling-demo');
  });
});
