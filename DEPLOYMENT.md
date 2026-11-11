# SignBridge Deployment Guide ($0 hosting)

This guide deploys SignBridge using only free tiers: Cloudflare Pages for
the frontend, Render's free web service tier for the two backend services
that the frontend actually depends on. Nothing here requires a paid plan.

Read the note on Render's card requirement in "Before you start" before
beginning, since this could not be fully resolved from outside research.

## Architecture at a glance

```
Browser
  |
  |-- Cloudflare Pages (frontend/, Next.js)
  |     |-- calls --> Render: signbridge-backend (Word Signs + suggestions)
  |     '-- calls --> Render: signbridge-soundsigns (Talk to Sign)
  |
  '-- MediaPipe + TensorFlow.js run entirely in the browser for Letter Lens
      (no backend call for this feature)
```

`backend/app/` now serves both the Requesty suggestion endpoint and the
Word Signs ISL recognition endpoints (merged; see
`backend/app/isl_recognition`'s own docstring for the GPL-3.0 note on that
merge). It is part of this deployment as `signbridge-backend`.

## Before you start

- **Render's free tier and credit cards**: Render's own materials describe
  the free web service plan as not requiring a card. Multiple recent
  reports in Render's own community forum describe being asked for one
  during signup anyway. This is genuinely unresolved from outside research.
  Check what your own account is actually asked for at signup, and stop
  before entering payment details if you want to stay strictly card-free.
  If Render does require a card on your account, Hugging Face Spaces
  (Docker SDK) is a possible fallback using the same Dockerfiles in this
  repository, though its own free Docker-tier reliability has mixed
  reports too; test it yourself before committing either way.
- **Cold starts are real.** Render's free web services sleep after 15
  minutes with no traffic and take roughly 30 to 60 seconds to wake on the
  next request. Both Word Signs and Talk to Sign already show an honest
  "this is taking a while, it may be waking up" message in the UI during
  that window, with a working retry, this is expected behavior at $0, not
  a bug.
- **Nothing deploys itself.** This guide assumes you perform each step
  manually in Render's and Cloudflare's own dashboards. No account has
  been created and no service has been deployed by anyone other than you.

## Part 1: Deploy the two backend services on Render

Both services are defined in the `render.yaml` Blueprint at the repository
root, pointing at `backend/` and `backend/services/soundsigns/`. Each also
has its own `Dockerfile` if you end up using a Docker-only host instead.

1. Push this repository to your own GitHub account (if it is not there
   already).
2. In the Render dashboard, choose **New > Blueprint**, and connect the
   GitHub repository. Render will read `render.yaml` and propose two
   services: `signbridge-backend` and `signbridge-soundsigns`.
3. Confirm both are set to the **Free** plan before launching.
4. After the first deploy, open each service's **Environment** tab in
   Render and set the variables below. These are intentionally left unset
   in `render.yaml` (`sync: false`) so you set the real values yourself,
   not a guessed one baked into the repository.

### signbridge-backend (Word Signs + suggestions backend)

| Variable | Set to | Why |
|---|---|---|
| `ALLOWED_ORIGIN` | Your Cloudflare Pages URL, e.g. `https://signbridge.pages.dev` | CORS: without this, the browser will block the frontend's requests to this service. Comma-separate multiple origins if you ever need more than one. |
| `REQUESTY_API_KEY` | Your own real Requesty API key, optional | Without this, `/suggestions` returns an honest local-curated fallback instead of a real LLM call. |

### signbridge-soundsigns (Talk to Sign backend)

| Variable | Set to | Why |
|---|---|---|
| `ALLOWED_ORIGIN` | Your Cloudflare Pages URL | Same CORS reason as above. |
| `REQUESTY_API_KEY` | Your own real Requesty API key | Without this, `/translate` returns an honest error instead of a fake translation. This is the one secret this guide cannot provide for you. |
| `REQUESTY_MODEL` | Leave as the default (`nvidia/nemotron-3-super-120b-a12b`) unless you have a reason to change it | Already set correctly in `render.yaml`. |
| `REQUESTY_BASE_URL` | Leave as the default (`https://router.requesty.ai/v1`) | Already set correctly in `render.yaml`. |
| `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` | Optional | Only needed if you want the last-resort fallback providers active; the feature works with just `REQUESTY_API_KEY`. |

5. Once both services finish deploying, note their real Render URLs (they
   look like `https://signbridge-backend.onrender.com` and
   `https://signbridge-soundsigns.onrender.com`). You will need both in
   Part 2.

## Part 2: Deploy the frontend on Cloudflare Pages

1. In the Cloudflare dashboard, go to **Workers & Pages > Create > Pages
   > Connect to Git**, and select this repository.
2. Cloudflare should auto-detect a Next.js project. Set the project's root
   directory to `frontend/` (not the repository root), since that is
   where the actual Next.js app lives.
3. Before the first build, add these two **environment variables** in the
   Cloudflare Pages project settings (under Settings > Environment
   variables), using the real Render URLs from Part 1:

| Variable | Set to |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Your real `signbridge-backend` Render URL |
| `NEXT_PUBLIC_SOUNDSIGNS_SERVICE_URL` | Your real `signbridge-soundsigns` Render URL |

4. Trigger the build. On success, Cloudflare gives you a real `*.pages.dev`
   URL.
5. **Go back to Part 1** and update both Render services' `ALLOWED_ORIGIN`
   to this real Cloudflare Pages URL (you likely set a placeholder or left
   it blank before this URL existed). Redeploy both Render services after
   this change so the new CORS origin takes effect.

## Part 3: Verify the deployment

Do these checks in order; each depends on the previous one actually
working.

1. **Backend health checks.** Visit
   `https://<your-backend-url>/health`,
   `https://<your-backend-url>/isl-recognition/health`, and
   `https://<your-soundsigns-url>/health` directly in a browser. Expect a
   real JSON response (not a timeout) once each service is awake; the
   first request after idle time may take up to a minute.
2. **Frontend loads.** Visit your real `*.pages.dev` URL. The homepage,
   Explore Signs, and Quick Cards should all work with no backend calls
   at all, since they are frontend-only.
3. **Word Signs end to end.** Open Word Signs, allow camera access, and
   confirm a prediction request reaches the real Render service (check the
   browser's network tab for a call to your real
   `NEXT_PUBLIC_BACKEND_URL`, not `localhost`). If the
   service was asleep, expect the honest "waking up" message first.
4. **Talk to Sign end to end.** Open Talk to Sign, type or speak a
   sentence, confirm it, and check that a real translation comes back
   (this requires the `REQUESTY_API_KEY` from Part 1 to actually be set;
   without it, expect a clear error, not a fake gloss).
5. **Video playback.** Confirm the real vendored video clips play back for
   recognized words in both Talk to Sign and Explore Signs. These are
   served from Cloudflare Pages itself (bundled as static assets), not from
   Render, so they should work even while a Render service is asleep.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser console shows a CORS error calling a Render service | `ALLOWED_ORIGIN` on that service does not match the real Cloudflare Pages origin exactly (including `https://`, no trailing slash) | Re-check and redeploy with the exact origin |
| Word Signs or Talk to Sign hangs for 30-60 seconds on first use | Render free-tier cold start after 15 minutes idle | Expected behavior; wait for the honest "waking up" message, then retry |
| Talk to Sign always returns an error, never a translation | `REQUESTY_API_KEY` is not set on the `signbridge-soundsigns` Render service, or the key is invalid | Set a real key in Render's Environment tab and redeploy |
| Frontend build fails on Cloudflare Pages | Root directory not set to `frontend/`, or a missing `NEXT_PUBLIC_*` variable | Re-check Part 2, step 2 and 3 |
| A Render service repeatedly fails to start | Check the service's real build/deploy logs in Render's dashboard for the actual Python error, this guide cannot predict every possible dependency issue | Fix the real error shown, re-deploy |
| Render asks for a credit card during signup | Unresolved ambiguity in Render's own free-tier terms, see "Before you start" | Decide whether to proceed, or try the Hugging Face Spaces Docker fallback with the same Dockerfiles |

## What this guide does not cover

- `backend/app/main.py` is not deployed here, since nothing in the current
  frontend calls it. If a future feature needs it again, add a third
  Render service to `render.yaml` mirroring the existing two, pointing its
  `rootDir` at `backend/`.
- A custom domain is not covered here; both Cloudflare Pages and Render
  support custom domains on their free tiers, set one up in each
  platform's own dashboard once you are ready.
- This guide does not create, pay for, or verify any live account or
  deployment on your behalf. Every step above must be performed in your
  own Render and Cloudflare dashboards.
