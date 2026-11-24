# cel_position

A browser application with no runtime dependencies that shows a phone's live orientation angles and whether it reports gyroscope rotation.

> **Project history:** originally created in 2022, modernized in 2026.

## Purpose

`cel_position` answers one practical question: what do the browser's motion sensors report on this device, right now? It reads the standard `deviceorientation` and `devicemotion` events and presents them in a form that is useful when checking a device or learning the API.

## Why this project exists

The project began as an experiment with the HTML5 device orientation APIs. The original page never displayed live readings: it looked up element IDs that did not exist and evaluated gyroscope support before any sensor event could arrive. The 2026 version keeps the same goal, renders live readings, and adds the explicit permission flow that browsers with a motion permission API expect.

## What it does

- Displays alpha, beta, and gamma angles and the `absolute` flag.
- Classifies tilt as flat, face down, top raised, top lowered, left side lowered, or right side lowered.
- Reports a gyroscope as detected once a non-zero rotation rate arrives.
- Requests motion permission only after a user gesture on browsers that require it.
- Explains unsupported browsers, insecure contexts, and denied permission.
- Coalesces high-frequency sensor events into one render per animation frame.

Sensor data stays in the page. The application makes no network requests after loading its own files, and its Content Security Policy blocks script-initiated connections such as `fetch`, XHR, and WebSocket.

## Architecture

```text
src/
  index.html            Document and Content Security Policy
  main.js               Browser entry point
  app.js                Composition and application flow
  domain/orientation.js Validation, formatting, tilt classification
  sensors/              Permission handling and event subscription
  ui/dashboard.js       DOM rendering through textContent
  styles/main.css       Responsive light and dark theme
tools/                  Local development server and test report generator
tests/                  Unit and integration suites
db/schema.sql           Optional SQLite schema
```

This is a client-only application, so it has no `frontend/` and `backend/` split. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start

Requires Node.js `^24.15.0` or `>=26.0.0`. The application itself has no runtime dependencies.

```bash
nvm use
npm ci --ignore-scripts
npm start
```

Open <http://127.0.0.1:8080>. Opening `index.html` directly from disk does not work because browsers block ES modules on `file://`.

## Usage guide

Sensors need physical hardware and a secure context, so a desktop browser usually shows no readings. The Android and iOS steps below have not been tested on a physical device.

**Android over USB.** With USB debugging enabled, forward the port and open `http://localhost:8080` in Chrome on the phone:

```bash
adb reverse tcp:8080 tcp:8080
```

**iOS or any remote device.** Publish `src/` on any static HTTPS host, open the page, and select **Enable sensors**.

**Chrome DevTools.** Open **More tools > Sensors**, select **Enable sensors** on the page, and override the orientation to simulate movement.

| Reading | Meaning | Range |
| --- | --- | --- |
| Alpha | Rotation around the z axis | 0 to 360 |
| Beta | Front-to-back tilt around the x axis | -180 to 180 |
| Gamma | Left-to-right tilt around the y axis | -90 to 90 |
| Absolute | Whether the angles are relative to Earth's frame | Yes or No |

Values outside these ranges are treated as missing and displayed as `n/a`.

## Configuration

The development server reads two environment variables.

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address. Keep the loopback default unless you trust the network. Requests are accepted only for loopback host names and this address, so a wildcard such as `0.0.0.0` still serves loopback names only. |
| `PORT` | `8080` | Listening port. |

## Database (optional)

**The application does not use a database.** [db/schema.sql](db/schema.sql) is an optional SQLite schema for anyone who wants to store captured sessions. Nothing in the application reads or writes it.

```bash
sqlite3 captures.sqlite < db/schema.sql
```

The schema requires SQLite 3.37 or later for `STRICT` tables. Timestamps must be UTC in the form `YYYY-MM-DDTHH:MM:SSZ`. SQLite enables foreign keys per connection, so run `PRAGMA foreign_keys = ON;` on every connection that writes, or session deletes will not cascade.

## Testing

```bash
npm test
npm run test:report
```

The suites use the Node.js test runner, with jsdom for DOM behavior and in-memory SQLite for the schema. `npm run test:report` writes [reports/tests/junit.xml](reports/tests/junit.xml) and [reports/tests/summary.json](reports/tests/summary.json) from an actual run.

Automated tests simulate sensor events. Readings and gyroscope detection were also checked by hand in headless Chrome 157 with emulated orientation and motion sensors; that check is not part of the committed suite. Neither exercises physical device sensors.

## Security notes

- Strict Content Security Policy with no inline script or style.
- All output is written through `textContent`, and sensor values are validated before use.
- No cookies, storage, analytics, or third-party scripts.
- The development server binds to loopback, rejects unexpected `Host` headers to resist DNS rebinding, and blocks path traversal, escaping symlinks, and non-allowlisted file types.
- `frame-ancestors` cannot be set in a meta tag, so static hosts should send the headers listed in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

See [SECURITY.md](SECURITY.md) and [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Credits and license

The original project drew on an article about these sensor APIs by Eduard Tomás (campusMVP). The 2022 prototype also contained a `handleOrientation` stub matching the MDN Web Docs guide "Detecting device orientation"; the 2026 code replaces it.

No open-source license has been declared, so all rights are reserved by default.

See [CHANGELOG.md](CHANGELOG.md) and [RELEASE_NOTES.md](RELEASE_NOTES.md) for version details.
