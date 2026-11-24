# Security Audit

**Date:** 2026-11-23. **Scope:** all tracked files on `modernize/2026` and the single prior commit.

This was a manual review supported by pattern searches, `gitleaks`, `npm audit`, and automated tests, followed by a second review of the first modernization commit. It is not a penetration test.

## Fixed

| Area | Before | After |
| --- | --- | --- |
| DOM injection | Values written through `innerHTML` | `textContent` only, with validated numeric input |
| Inline code | Inline `onclick` handler | Event listeners and a CSP without `unsafe-inline` |
| Content policy | None | Restrictive CSP with `default-src 'none'` |
| Runtime errors | Null `rotationRate` and missing elements raised exceptions | Null-safe handling, covered by tests |
| Sensor privacy | No permission flow | On browsers with a permission API, requests access only after a user gesture |
| Sensor validation | Rotation rates read without type checks | Only finite numeric rates count as gyroscope data |
| Referrer leakage | Browser default | `no-referrer` |
| Supply chain | No manifest | Exact versions, committed lockfile, lifecycle scripts disabled |
| CI | None | Read-only token, actions pinned to commit SHAs, no persisted credentials |
| Local server | None | Loopback default, `Host` header validation against DNS rebinding, traversal and symlink protection, method and file type allowlists |

## Checks performed

| Check | Result |
| --- | --- |
| `gitleaks` with redaction on the git history and working tree | No findings on 2026-11-23 |
| Hardcoded credentials and private keys in text files | None found |
| Email and phone patterns in tracked text files | None found |
| `eval`, `new Function`, `document.write` in `src/` and `tools/` | None found |
| `npm audit` on the full dependency tree | 0 vulnerabilities on 2026-11-23 |
| SQL injection | Not applicable: the application runs no SQL, and tests use bound parameters |
| CSRF | Not applicable: no sessions, cookies, or state-changing endpoints |
| Authentication, 2FA, and password hashing | Not applicable: no accounts, login, forms, or credentials |
| Cryptography | Not applicable: the code performs no cryptographic operations |
| CI action pins | Resolve to upstream tags `actions/checkout` v7.0.1 and `actions/setup-node` v7.1.0 |

The three saved third-party PDFs contained images rather than extractable text, so the automated patterns could not inspect their contents. They have since been removed.

## Resolved after the audit

| Item | Severity | Status |
| --- | --- | --- |
| Third-party PDFs with unverified redistribution rights were in the tree and in history. One stated that it was not for release, publication, or distribution in any jurisdiction where that would be unlawful. | Legal or compliance | Resolved: removed from the tree in 1.0.0 and from the history by the 2026-11-24 history rewrite. Copies published before then may persist elsewhere. |

## Open items

| Item | Severity | Status |
| --- | --- | --- |
| `frame-ancestors` and `Permissions-Policy` require response headers, which depend on the chosen static host. | Low | Documented in `docs/ARCHITECTURE.md` |
| Behavior on physical devices has not been verified. Headless Chrome 157 with emulated orientation and motion sensors rendered readings and detected the gyroscope with no console errors under the CSP. | Informational | Requires manual testing |
