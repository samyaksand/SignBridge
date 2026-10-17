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

## Accounts and history

- There is no sign-up, login, or account anywhere in the app.
- Family Practice and Child Mode only keep their progress in memory, in a
  React state, while the page is open. Refreshing or closing the tab clears
  it. Nothing is saved to a database.

## Analytics and ads

- There are no analytics scripts, trackers, or ad code in this project.

## The optional backend

- `backend/` is a small FastAPI app that is entirely optional. The frontend
  works fully without it.
- If you ever run it with a `REQUESTY_API_KEY`, the only thing sent to the
  Requesty API would be the words you already confirmed and your chosen
  output language, never raw video, never landmark coordinates, never a
  recording. Without a key, it only uses a local, built-in suggestion list.

## In short

Your camera stays on your device. Your practice sessions are not stored
anywhere. There is nothing to opt out of, because there is nothing being
collected.
