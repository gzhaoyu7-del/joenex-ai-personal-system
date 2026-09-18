# Live demo deployment

The JOENEX portfolio's runnable application is **Knowledge Orbit**, a personal product prototype. Its live site is https://knowledge-orbit.netlify.app.

## Hosting configuration

The existing Netlify site is reused; a second hosting account or site is not required.

| Setting | Value |
| --- | --- |
| Runtime for builds | Node.js 22 |
| Install | `npm ci` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Required environment variables | None |
| SPA fallback | `/* /index.html 200` |

`netlify.toml` contains the build settings, SPA fallback, and response headers. `public/_redirects` and `public/_headers` are also copied into the production output for direct static deployments. Deploy only `dist`, not the project folder, local environment files, or CLI state.

This release uses the authenticated Netlify CLI. Automatic deployment from GitHub is not currently connected. For optional automatic updates, link `gzhaoyu7-del/joenex-ai-personal-system`, select `main`, and use the settings above on the existing Netlify site.

## Assets and browser requirements

- Three.js renders procedural particles; there are no external 3D model or texture downloads. Use a modern WebGL-capable browser.
- MediaPipe's hand model and WebAssembly files are served from `/mediapipe/` on the same HTTPS origin. Keep all files in `public/mediapipe/`; they are runtime dependencies, not temporary artifacts.
- The PDF.js worker is bundled under `dist/assets/`. Text-based PDFs are supported; scanned-document OCR is not implemented.
- Gesture control requires camera permission and suitable hardware. A rejected permission or model initialization error is displayed without disabling the normal draw controls. Disabling gestures releases the camera.
- Audio is subject to browser autoplay rules and starts after user interaction. No microphone or geolocation permission is requested.
- Decks and settings use browser local storage. They are device/browser-specific and can be removed by clearing site data.

## AI scope and privacy

The default demo uses a local, rule-based concept extraction preview, not a hosted AI model. No OpenAI API is configured. Optional OpenRouter extraction is a client-side BYOK prototype, not a secure production AI backend. If a visitor supplies a key and submits content through that route, the text is sent directly to OpenRouter, and the key is persisted in that visitor's local storage. Do not use confidential material or long-lived credentials to test this demo.

## Release checks

Before deployment, run `npm run lint` and `npm run build`, inspect the publish directory for secrets, and test the production preview. Verify the live site after publishing: draw/reveal, Creator Mode, workbench, mobile layout, SPA fallback, camera denial, model failure, and successful model initialization.

The published release passed lint and production build, plus automated Edge checks on both the local production preview and the HTTPS demo. The checks covered draw/reveal, Creator Mode, opening the deck library, a mobile entry point, SPA fallback, denied/unavailable camera access, an interrupted model download, and successful hand-model initialization using a synthetic camera stream. Each tested camera scenario left normal draw controls usable with no uncaught page errors. Real-hand recognition accuracy still depends on the visitor's camera, lighting, and browser; synthetic-camera tests do not validate that accuracy. No paid AI call was made.

The live model, WASM variants, JavaScript bundle, and PDF worker returned successful responses with suitable content types. Requests to `/.env` and `/.git/config` returned the SPA entry page, not private files. Repository/history and production-output scans found no embedded credentials; MediaPipe's upstream build-path strings match the installed dependency binaries.

Vite currently reports a large-chunk warning because the main bundle includes 3D and PDF-related functionality. This does not fail the build, but first load on a slow connection can take longer. Asset splitting can be a later performance improvement without changing the product design.
