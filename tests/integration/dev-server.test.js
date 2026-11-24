import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { allowedHostnamesFor, createDevServer } from '../../tools/dev-server.js';

function send(port, rawPath, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const outgoing = request({ host: '127.0.0.1', port, path: rawPath, method, headers }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    outgoing.on('error', reject);
    outgoing.end();
  });
}

describe('development server', () => {
  let sandbox;
  let server;
  let port;

  before(async () => {
    sandbox = mkdtempSync(path.join(tmpdir(), 'cel-position-server-'));
    const root = path.join(sandbox, 'public');
    mkdirSync(root);
    writeFileSync(path.join(root, 'index.html'), '<h1>ok</h1>');
    writeFileSync(path.join(root, 'app.js'), 'export {};');
    writeFileSync(path.join(root, 'private.env'), 'blocked');
    writeFileSync(path.join(sandbox, 'outside.js'), 'outside');
    symlinkSync(path.join(sandbox, 'outside.js'), path.join(root, 'link.js'));
    server = await createDevServer({ root });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(sandbox, { recursive: true });
  });

  it('serves the index document with security headers', async () => {
    const response = await send(port, '/');
    assert.equal(response.status, 200);
    assert.equal(response.body, '<h1>ok</h1>');
    assert.match(response.headers['content-security-policy'], /frame-ancestors 'none'/);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['referrer-policy'], 'no-referrer');
  });

  it('serves JavaScript with the correct media type', async () => {
    const response = await send(port, '/app.js');
    assert.match(response.headers['content-type'], /text\/javascript/);
  });

  for (const attempt of ['/../outside.js', '/..%2foutside.js', '/%2e%2e/outside.js']) {
    it(`blocks traversal through ${attempt}`, async () => {
      const response = await send(port, attempt);
      assert.equal(response.status, 404);
      assert.equal(response.body.includes('outside'), false);
    });
  }

  it('blocks symlinks that escape the root', async () => {
    assert.equal((await send(port, '/link.js')).status, 404);
  });

  it('blocks file types outside the allowlist', async () => {
    assert.equal((await send(port, '/private.env')).status, 404);
  });

  it('rejects malformed encoding', async () => {
    assert.equal((await send(port, '/%E0%A4%A')).status, 400);
  });

  it('rejects null bytes', async () => {
    assert.equal((await send(port, '/index.html%00.js')).status, 400);
  });

  it('rejects write methods', async () => {
    const response = await send(port, '/', 'POST');
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
  });

  for (const host of ['attacker.example', 'attacker.example:8080', 'localhost@attacker.example', 'localhost.attacker.example']) {
    it(`rejects the foreign Host header ${host}`, async () => {
      const response = await send(port, '/', 'GET', { Host: host });
      assert.equal(response.status, 403);
      assert.equal(response.body.includes('ok'), false);
    });
  }

  for (const host of ['localhost:8080', 'LOCALHOST', '127.0.0.1:8080', '[::1]:8080']) {
    it(`accepts the loopback Host header ${host}`, async () => {
      assert.equal((await send(port, '/', 'GET', { Host: host })).status, 200);
    });
  }

  it('allows an explicit bind address as a Host', () => {
    assert.equal(allowedHostnamesFor('192.0.2.10').has('192.0.2.10'), true);
    assert.equal(allowedHostnamesFor('::1').has('[::1]'), true);
  });

  it('does not treat a wildcard bind address as a valid Host', () => {
    assert.equal(allowedHostnamesFor('0.0.0.0').has('0.0.0.0'), false);
    assert.equal(allowedHostnamesFor('::').has('[::]'), false);
  });

  it('answers HEAD without a body', async () => {
    const response = await send(port, '/', 'HEAD');
    assert.equal(response.status, 200);
    assert.equal(response.body, '');
  });
});
