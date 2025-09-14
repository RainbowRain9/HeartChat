# Repository Guidelines

## Project Structure & Module Organization
- Miniprogram UI: `miniprogram/` (pages, components, styles, images, utils, services, config).
  - Pages: `miniprogram/pages/<feature>/` with `index.wxml|wxss|js|json`.
  - Components: `miniprogram/components/<kebab-case>/` (support TS in `.ts`).
  - Services: `miniprogram/services/` for data/API helpers.
  - Tests: `miniprogram/__tests__/`.
- Cloud functions: `cloudfunctions/<function>/index.js` (+ helpers per folder).
- Tooling/config: `package.json`, `.eslintrc.js`, `.prettierrc.js`, `project.config.json`.
- Docs: `doc/`.

## Build, Test, and Development Commands
- Install deps: `npm install`
- Dev env flag: `npm run dev` (sets `NODE_ENV=development`).
- Build npm packages for DevTools: `npm run build:npm` (outputs to `miniprogram/`).
- Production build: `npm run build`
- Lint: `npm run lint` | Auto-fix: `npm run lint:fix`
- Format: `npm run format`
- Tests: `npm test`
- Clean npm output: `npm run clean`

Tip: In WeChat DevTools, enable “Use npm” and run `npm run build:npm` before preview/upload.

## Coding Style & Naming Conventions
- Indentation 2 spaces, single quotes, semicolons; no dangling commas.
- Prefer `const`, enforce `eqeqeq`, no unused vars (underscore to ignore).
- TypeScript allowed in components/tests; keep UI JS concise, move logic to `services/`.
- Naming: components in `kebab-case`; page folders in `lower-hyphen`; tests `*.test.ts`.

## Testing Guidelines
- Framework: Jest. Tests live in `miniprogram/__tests__/`.
- Name tests `*.test.ts` and mock `wx` APIs as needed.
- Run locally with `npm test`; keep tests fast and deterministic.
- Aim for coverage on services and cloud function contracts.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- PRs must include: clear summary, scope of change, test notes, and screenshots for UI.
- Link related issues; keep PRs focused and under ~300 lines when possible.

## Security & Configuration Tips
- Do not commit secrets. Keep environment IDs/tokens out of code where possible; prefer cloud env vars.
- `project.config.json` and `miniprogram/config/index.js` contain environment references—update thoughtfully and document changes.
