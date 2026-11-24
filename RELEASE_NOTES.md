# Release Notes: v1.0.1

Released on 2026-11-24.

This is a documentation-only patch release. It corrects the release notes, security audit and deployment guide, which still described the removed third-party PDFs as present in the repository and 1.0.0 as unpublished. There is no change in code behaviour.

## Upgrade

No migration is needed from 1.0.0. When upgrading from the unversioned 2022 code, note that the application now lives in `src/`, so any deployment that served the repository root must publish `src/` instead.

```bash
nvm use
npm ci --ignore-scripts
npm test
npm start
```

## Known limitations

- Automated tests simulate sensor events, and a manual check used emulated sensors in headless Chrome. Physical devices have not been verified.
- No open-source license has been declared.
