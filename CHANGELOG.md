# Changelog

This project follows [Semantic Versioning](https://semver.org/) and the [Keep a Changelog](https://keepachangelog.com/) format.

## [1.0.0] - Unreleased

First versioned release. The original 2022 code carried no version number.

### Added

- Live orientation readings, tilt classification, and gyroscope detection.
- User-gesture permission flow for browsers that require it.
- Clear states for unsupported browsers, insecure contexts, and denied access.
- Hardened local development server.
- Unit and integration tests with a committed report.
- Optional SQLite schema, CI workflow, and architecture and security documentation.

### Changed

- **Breaking:** the entry point moved from `index.html` to `src/index.html`.
- Rewrote the single script as nested ES modules.
- Translated the interface, identifiers, and notes to English.

### Removed

- Removed the saved third-party PDFs, which the repository had no right to redistribute.
- Unused and non-functional functions, debug logging, and the reference to a missing image.

### Fixed

- Readings never rendered because element IDs did not match.
- Gyroscope support was evaluated before any sensor event could arrive.
- Null `rotationRate` values raised an exception.
- A device lying face down was labeled as top raised.
- Headings that round to 360 degrees now display as 0.0, and negative zero is no longer displayed.
- Repeated clicks no longer issue duplicate permission requests, and stopping the app during a pending request no longer starts listening.
- The optional schema now rejects invalid calendar dates and non-canonical timestamps.

### Security

- Replaced `innerHTML` with `textContent`, removed inline handlers, and added a strict CSP.
- Gyroscope detection accepts only finite numeric rotation rates.
- The development server rejects unexpected `Host` headers to resist DNS rebinding.
