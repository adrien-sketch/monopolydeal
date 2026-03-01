# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Type-check and build for production
- `npm run test` — Run all tests (Vitest)
- `npx vitest run src/components/FeedbackButton.test.tsx` — Run a single test file
- `npm run lint` — Lint with ESLint

## Architecture

React + TypeScript app scaffolded with Vite. Tests use Vitest + React Testing Library with jsdom.

- `src/components/` — React components (FeedbackButton, FeedbackModal)
- `src/test/setup.ts` — Vitest setup (jest-dom matchers)
- Vitest config lives in `vite.config.ts` (uses `vitest/config` defineConfig)

## Testing notes

jsdom does not implement `HTMLDialogElement.showModal()`/`.close()`. Tests polyfill these in `beforeAll`. After a `<dialog>` is closed, it loses the `dialog` ARIA role — query closed dialogs via `container.querySelector('dialog')` instead of `getByRole('dialog')`.
