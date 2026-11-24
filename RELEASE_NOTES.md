# Release Notes: v1.0.0

**Status:** prepared, not yet tagged or published.

`cel_position` began in 2022 as a device orientation experiment and was modernized in 2026 into a tested, client-only application.

## Highlights

- Live alpha, beta, gamma, and tilt readings with one render per animation frame.
- Gyroscope detection and a user-gesture permission flow.
- No runtime dependencies and a strict Content Security Policy.
- Automated unit and integration tests, with results in `reports/tests/`.

## Breaking changes

The application now lives in `src/`. Any deployment that served the repository root must publish `src/` instead.

## Upgrade

```bash
nvm use
npm ci --ignore-scripts
npm test
npm start
```

## Known limitations

- Automated tests simulate sensor events, and a manual check used emulated sensors in headless Chrome. Physical devices have not been verified.
- Saved third-party PDFs remain in the repository pending an owner decision. The campusMVP article is in Spanish, and the other two contain incidental Spanish text. All three are preserved unmodified.
- No open-source license has been declared.
