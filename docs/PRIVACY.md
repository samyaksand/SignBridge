# Privacy, the real details

This page explains exactly what SignBridge does and does not do with your
data, matching the actual code in this repository.

## Camera

- Child Mode only asks for camera access when you click "Start Camera."
- The video stream is attached straight to a `<video>` element in your
  browser. It is never recorded, never saved to a file, and never sent to
  any server, anywhere in this codebase. You can check this yourself:
  search `app/child/ChildModeClient.tsx` for any `fetch` or upload call near
  the camera code. There is none.
- When you click "Stop Camera," or leave the page, every camera track is
  stopped (`track.stop()`), which turns off the camera light.
- If camera permission is denied, the app does not break. It shows a
  friendly message and points you to Quick Cards instead.

## Sign recognition

- Child Mode's "demo guess" feature uses a small, fixed list of sample
  predictions built into the app (`lib/data/childPredictions.ts`). It does
  not look at your camera image at all. This is clearly labeled "Demo mode"
  in the interface, because there is no trained model yet.
- Nothing is ever spoken out loud, or added to your message, until you
  explicitly confirm which meaning you intended.

## Accounts, paywalls, and ads

- There is no sign-up, login, or account anywhere in the app.
- There are no paywalls. The core features (Child Mode, Quick Cards, Family
  Practice, the avatar stage) are free to use and nothing is locked behind a
  payment.
- There are no ads anywhere in this project.

## History and session state

- Child Mode only keeps its progress (predictions,
  your in-progress message, any AI sentence suggestions) in memory, in React
  state, while the page is open. Refreshing or closing the tab clears it.
  Nothing is saved to a database, and there is no persistent child profile
  or persistent learning history anywhere in this app.
- Communication Preferences (communication mode, Hindi/English choice,
  reduced motion, speech on/off) are session-only too, they reset the
  moment you reload the page, the same as everything else above.
- The one narrow exception is **text size**. Text size is saved in your
  browser's `localStorage` so a larger or smaller font choice survives a
  reload, the same way a dark/light theme toggle would. This is not a
  profile: it holds a single display preference, nothing about you, your
  child, your signs, or your activity, and it is never read by, or sent to,
  any server. You can clear it anytime by clearing your browser's site data
  for this page.

## Analytics

- There are no analytics scripts or trackers of any kind, by default or
  otherwise. Nothing about how you use this app is measured or recorded.

## The optional backend and AI sentence suggestions

- `backend/` is a small FastAPI app that is entirely optional. The frontend
  works fully without it running at all.
- Child Mode has an optional "Suggest a sentence" button. It only appears
  next to words you have already confirmed. If you tap it, the app sends
  **only those confirmed short words and your chosen output language** to
  the optional backend, nothing else, never raw video, never camera
  frames, never landmark coordinates, never a recording. The backend's
  request schema is built so that anything else (like a frame of video or
  an array of coordinates) cannot be sent through it even by mistake.
- If the backend is not running, or has no `REQUESTY_API_KEY` configured
  (the default), you get a small built-in list of curated phrases instead,
  no network call happens at all in that case.
- If a `REQUESTY_API_KEY` is configured, that request goes to Requesty's
  router (`https://router.requesty.ai`), which relays it to one of several
  third-party language models to write 2 to 3 suggested sentences.
- Suggestions are always labeled as AI-generated suggestions, not as a
  verified ISL translation or a fact. You must review, optionally edit, and
  explicitly confirm the exact sentence before it can ever be spoken aloud,
  the same confirm-before-speak rule that applies everywhere else in this
  app.

## Camera, again: no recording, ever

- Nothing from your camera is ever recorded to a file, stored, or sent to
  any server, anywhere in this codebase, with or without the backend
  running. The backend above never receives video or images under any
  circumstance.

## Offline support: honest answer

- SignBridge does **not** currently work fully offline. The frontend is a
  regular Next.js app with no service worker or offline cache configured.
  The first time you open it (and after some updates), your browser still
  needs to fetch the page's JavaScript and assets over the network. Once
  loaded, most screens do not need the network again until you reload, but
  we are not claiming true offline support, because we have not built or
  verified a service worker that would make that true.

## In short

Your camera stays on your device and is never recorded. Nothing you do in
this app is tracked, stored in a profile, or sold. The one thing saved
across visits is your text size preference, and that is just a display
setting. If you try the optional AI sentence suggestions, only your
confirmed words and chosen language ever leave your device, and you always
get to review and confirm before anything is spoken.
