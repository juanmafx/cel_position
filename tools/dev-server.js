import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('../src/', import.meta.url));

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];
const WILDCARD_BIND_HOSTS = new Set(['0.0.0.0', '::', '[::]']);

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'accelerometer=(self), gyroscope=(self), magnetometer=(self), camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export function allowedHostnamesFor(bindHost = '127.0.0.1') {
  const hostnames = new Set(LOOPBACK_HOSTNAMES);
  if (!WILDCARD_BIND_HOSTS.has(bindHost)) {
    hostnames.add(bindHost.includes(':') ? `[${bindHost}]` : bindHost.toLowerCase());
  }
  return hostnames;
}

function isAllowedHost(hostHeader, allowedHostnames) {
  try {
    return allowedHostnames.has(new URL(`http://${hostHeader}`).hostname);
  } catch {
    return false;
  }
}

function reject(response, statusCode, extraHeaders = {}) {
  response.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    ...extraHeaders,
    'Content-Type': 'text/plain; charset=utf-8',
  });
  response.end(`${statusCode}\n`);
}

function decodeRequestPath(url) {
  try {
    const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
    return pathname.includes('\0') ? null : pathname;
  } catch {
    return null;
  }
}

function isInsideRoot(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function resolveAsset(root, pathname) {
  const relativePath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const candidate = path.resolve(root, `.${relativePath}`);
  if (!isInsideRoot(root, candidate)) {
    return null;
  }
  try {
    const resolved = await realpath(candidate);
    const details = await stat(resolved);
    const isServable = isInsideRoot(root, resolved)
      && details.isFile()
      && Object.hasOwn(CONTENT_TYPES, path.extname(resolved));
    return isServable ? resolved : null;
  } catch {
    return null;
  }
}

export async function createDevServer({ root = DEFAULT_ROOT, allowedHostnames = allowedHostnamesFor() } = {}) {
  const canonicalRoot = await realpath(root);

  return createServer(async (request, response) => {
    if (!isAllowedHost(request.headers.host, allowedHostnames)) {
      reject(response, 403);
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      reject(response, 405, { Allow: 'GET, HEAD' });
      return;
    }
    const pathname = decodeRequestPath(request.url);
    if (pathname === null) {
      reject(response, 400);
      return;
    }
    const asset = await resolveAsset(canonicalRoot, pathname);
    if (!asset) {
      reject(response, 404);
      return;
    }
    response.writeHead(200, {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      'Content-Type': CONTENT_TYPES[path.extname(asset)],
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    const stream = createReadStream(asset);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? 8080);
  const server = await createDevServer({ allowedHostnames: allowedHostnamesFor(host) });
  server.listen(port, host, () => {
    console.log(`Serving on http://${host}:${server.address().port}`);
  });
}
