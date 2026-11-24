# Architecture

## Overview

`cel_position` is a static, client-only web application. There is no backend, so the code is not divided into `frontend/` and `backend/`. The Node.js code in `tools/` exists only for local development and test reporting and is not part of the deployed application.

```text
Browser sensor events
        |
        v
sensors/sensor-stream.js     subscribe and unsubscribe
        |
        v
app.js                       flow control, one render per frame
        |            \
        v             v
domain/orientation.js  ui/dashboard.js
validate and classify  render through textContent
```

## Module structure

```text
src/
  index.html
  main.js
  app.js
  domain/
    orientation.js
  sensors/
    permission.js
    sensor-stream.js
  ui/
    dashboard.js
  styles/
    main.css
tools/
  dev-server.js
  generate-test-report.js
tests/
  unit/
  integration/
db/
  schema.sql
```

| Module | Responsibility | May depend on |
| --- | --- | --- |
| `domain/` | Pure validation, formatting, and classification | Nothing |
| `sensors/` | Browser permission and event APIs | Injected `window` |
| `ui/` | DOM updates | `domain/`, injected `document` |
| `app.js` | Wiring and state transitions | All of the above |
| `main.js` | Passes the real `window` to `startApp` | `app.js` |

## Design decisions

- **Injected browser objects.** `startApp` receives `window`, which lets the same code run under jsdom with simulated events.
- **Frame coalescing.** Sensors can fire faster than the display refreshes. Only the latest reading is rendered, once per animation frame.
- **Validate at the boundary.** Event values become numbers in range or `null` before any other module sees them.
- **Permission inside the gesture.** Orientation and motion requests are issued synchronously from the click handler, as iOS Safari requires a user gesture.
- **No runtime dependencies.** The deployed files are plain ES modules and CSS with no build step.
- **Host validation in development.** The local server answers only loopback host names and its configured bind address, which resists DNS rebinding.

## Recommended deployment

Publish only the `src/` directory to a static HTTPS host. Do not publish the repository root, because it also holds tests, tooling and documentation that are not part of the application. Configure these response headers where the host supports them:

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Permissions-Policy: accelerometer=(self), gyroscope=(self), magnetometer=(self), camera=(), geolocation=(), microphone=()
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

## Optional persistence

`db/schema.sql` defines a SQLite model that is not connected to the application.

- `capture_sessions`: one recording, with timestamps, gyroscope detection, and an optional label.
- `orientation_samples`: readings keyed by session and millisecond offset, with range checks matching the domain validation. Deleting a session deletes its samples on connections that have run `PRAGMA foreign_keys = ON`.

Session timestamps are stored as UTC text in the form `YYYY-MM-DDTHH:MM:SSZ`, so text comparison matches chronological order. The schema requires SQLite 3.37 or later.

If capture is added later, keep it opt-in, because motion data can be used to fingerprint a device or infer user activity.
