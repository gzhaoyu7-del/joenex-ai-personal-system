# JOENEX / Knowledge Orbit

An interactive knowledge-discovery prototype that turns a deck of concepts into a cinematic spatial draw. Instead of presenting another flashcard grid, Knowledge Orbit invites the user to spin a field of ideas, land on one concept, and decide what to understand next.

[View the live prototype](https://knowledge-orbit.netlify.app)

![JOENEX AI website and web app portfolio](artifacts/joenex-ai-website-web-app.png)

## What the project demonstrates

- A responsive, animated knowledge orbit with randomized selection, staged deceleration, reveal states, and synchronized mechanical sound.
- A Three.js ambient scene combined with layered 2D card motion to create a lightweight 3D UI without sacrificing readable content.
- An interactive dashboard for creating, duplicating, selecting, and editing bilingual knowledge decks.
- Manual, batch, pasted-text, and text-based PDF input flows, including an editable concept-review step before a deck is created.
- Optional AI-assisted concept extraction through a user-supplied OpenRouter key, with a local semantic preview when no key is supplied.
- Browser-based hand-gesture control powered by MediaPipe: an open palm starts the orbit and a closed hand locks the target.
- Creator Mode with 9:16 and 16:9 safe-frame previews for recording short-form and landscape video.
- Keyboard, mouse, touch, reduced-motion, responsive-layout, and local-persistence support.

## Technology

- React 19 and TypeScript
- Vite
- Three.js with React Three Fiber
- Framer Motion
- Tailwind CSS plus a custom visual system
- Zustand for local application state
- MediaPipe Tasks Vision for on-device hand tracking
- PDF.js for in-browser text extraction
- Web Audio API for procedural interaction sound
- Netlify for the current prototype deployment

## Product and assistant concept

The current build includes an assistant-like knowledge workflow: source material can be parsed into candidate concepts, reviewed, edited, and converted into an interactive deck. The optional OpenRouter route is a **prototype BYOK integration** and runs directly from the browser.

Voice interaction is a **planned concept**, not an implemented feature. A production assistant version would also move AI requests behind a server-side proxy and add authentication, usage controls, and secure secret storage.

## Screenshots

Portfolio captures are stored in [`artifacts/phase15`](artifacts/phase15):

- [`01-home-bilingual.png`](artifacts/phase15/01-home-bilingual.png) — main desktop experience
- [`03-pdf-concept-preview.png`](artifacts/phase15/03-pdf-concept-preview.png) — extracted-concept review flow
- [`04-mobile-creator-bilingual.png`](artifacts/phase15/04-mobile-creator-bilingual.png) — mobile Creator Mode

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. No environment file is required for the default experience.

```bash
npm run lint
npm run build
npm run preview
```

### Optional AI route

The interface accepts an OpenRouter key at runtime. No API key is included in this repository. In this prototype, a user-entered key is stored in that browser's local storage and requests are sent directly to OpenRouter. Use a restricted, disposable key for testing; do not treat this client-side flow as production credential storage.

## Project status

This is a **personal project and product prototype**, built as a portfolio demonstration of interactive frontend engineering and spatial UI design.

Implemented today:

- Knowledge decks and browser persistence
- Animated random draw and selected-card reveal
- Creator Mode and responsive layouts
- Gesture input and procedural sound
- Text/PDF ingestion and concept review
- Local preview extraction and optional OpenRouter BYOK extraction

Prototype or planned:

- The visible Challenge action is reserved for a future phase and is currently disabled.
- Voice control and a conversational assistant are planned, not implemented.
- Authentication, cloud sync, payments, analytics, a backend AI proxy, and production-grade key management are not included.

The repository intentionally contains no bundled credentials or private environment configuration.
