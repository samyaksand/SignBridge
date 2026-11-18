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
across India, has almost none. A low-income family wanting to learn
together is usually priced out entirely, not because they lack ability,
but because every real option costs money they don't have.

SignBridge closes that gap: **free, full stop**, built specifically for
ISL rather than bolted on as an afterthought, covering everything from
daily greetings to family, food, and emotions, with no account and no
camera data ever leaving the device, and crediting the Deaf community's
own verified source material rather than guessing at it.

<div align="center">

| 500 | 136 | 99.99997% | $0 |
|:---:|:---:|:---:|:---:|
| verified ISL words | quick picture cards | model accuracy vs. the original | monthly hosting cost |

</div>

## The two core features

**📖 Explore Signs**: a searchable library of 500 verified ISL words,
filterable by category, with a daily practice checklist.

**🎙️ Talk to Sign**: speak a sentence, SignBridge converts it to real
ISL sentence structure with an LLM, then plays the matching video clips.

Also included: **Quick Cards** (136 picture cards), **Word Signs**
(camera-based ISL word recognition), and **Letter Lens** (real-time ASL
fingerspelling, fully client-side).

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

LLM translation via **Requesty** (fallback: OpenRouter, Groq, Gemini).
Hand-tracking via **MediaPipe Hands**, fully in-browser.

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
