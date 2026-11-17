# SignBridge

**Connecting hands, bridging worlds.**

[![Live on Cloudflare Workers](https://img.shields.io/badge/live-signbridge.samyaksand.com-1a9c4a?style=for-the-badge&logo=cloudflare&logoColor=white)](https://signbridge.samyaksand.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Deployed via OpenNext](https://img.shields.io/badge/deploy-OpenNext-orange?style=for-the-badge)](https://opennext.js.org/cloudflare)

SignBridge is a free, browser-based platform that helps families build
real, everyday Indian Sign Language (ISL) communication together, no
account, no camera data ever leaving the device, no paid class required.

**👉 Try it live: https://signbridge.samyaksand.com**

## Why this project

Most free sign-language tooling exists for ASL. ISL, spoken by millions
of Deaf and hard-of-hearing people across India, has almost none. A
family wanting to learn together is usually left choosing between a
class they can't afford and a handful of disconnected YouTube clips with
no way to search, practice, or confirm they're learning the right thing.
For a child from a low-income family, that gap can simply mean never
learning to sign with a Deaf parent or sibling at all, not because they
don't want to, but because every existing option costs money their
family doesn't have.

SignBridge is built around three things that actually matter here:

- **Equity**: free, full stop. The kids who need this most are usually
  the ones least able to afford it, a child from a low-income family
  shouldn't be shut out of learning to sign with a Deaf parent or
  sibling just because every existing option costs money they don't have.
- **Accessibility**: no account, no camera data ever leaving the
  device, accessible roles and labels throughout, nothing speaks or acts
  on its own without the user confirming first.
- **Inclusion**: built for ISL specifically, a language with far less
  free tooling than ASL, not bolted on as an afterthought.

That's **500+ verified ISL words**, a full speech-to-sign pipeline, and
camera-based recognition, all free, all in the browser.

<div align="center">

| 500 | 136 | 99.99997% | $0 |
|:---:|:---:|:---:|:---:|
| verified ISL words | quick picture cards | model accuracy vs. the original | monthly hosting cost |

</div>

## The two core features

**📖 Explore Signs: a real, searchable ISL dictionary**

500 everyday ISL words, each individually verified against the official
Indian government ISL dictionary, searchable and filterable by category,
with a daily "5 words to learn today" practice checklist that saves your
progress right on your own device.

**🎙️ Talk to Sign: speech, translated live into ISL**

Speak a sentence. SignBridge captures it with the browser's own speech
recognition, sends the confirmed text to an LLM that reorders it into
real ISL sentence structure (sign language grammar isn't the same as
spoken English), then plays back real sign-language video clips for each
word in sequence. No typing, no manual lookup, just talk and watch it
sign back.

Alongside these two, SignBridge also ships **Quick Cards** (136 picture
cards for instant communication), **Word Signs** (camera-based ISL word
recognition via a RandomForest classifier and a from-scratch NumPy LSTM,
verified against the original model's reference output to 4.77e-7), and
**Letter Lens** (real-time ASL fingerspelling, fully client-side).

## Built with

![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-black?style=flat-square&logo=flask&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white)

Speech-to-ISL translation is LLM-driven via **Requesty** (OpenAI-compatible
router), with OpenRouter, Groq, and Gemini as last-resort fallbacks.
Hand-tracking runs on **MediaPipe Hands**, fully in the browser.

<details>
<summary><strong>Running it locally</strong></summary>

```
npm install
npm run dev
```

Starts the frontend at `localhost:3000` and the backend at `localhost:8000`.

```
npm run dev:all
```

Also starts the Talk to Sign backend locally.

See `DEPLOYMENT.md` for the full production deployment guide, and `docs/`
for architecture, privacy, and per-feature technical detail.

</details>
