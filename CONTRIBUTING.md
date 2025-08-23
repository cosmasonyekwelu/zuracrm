
# Contributing

## Branching & PRs
- Create feature branches: `feat/<scope>` or `fix/<scope>`.
- Keep PRs small and focused; include screenshots for UI changes.

## Commit Style
- Conventional-ish: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Present tense, concise subject line.

## Code Quality
- Run `npm run lint` in client/server before pushing.
- Prefer small, pure functions. Handle errors explicitly.

## Tests
- Add unit tests where possible (Jest/Vitest recommended).

## Local Data
- Use `node src/seed.js` to populate demo data; add `--purge` to reset.
