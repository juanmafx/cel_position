import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import { startApp } from '../../src/app.js';

const html = readFileSync(new URL('../../src/index.html', import.meta.url), 'utf8');

function createBrowser(overrides = {}) {
  const { window } = new JSDOM(html);
  const frames = [];
  window.requestAnimationFrame = (callback) => frames.push(callback);
  window.isSecureContext = true;
  window.DeviceOrientationEvent = class {};
  Object.assign(window, overrides);
  return {
    window,
    text: (id) => window.document.getElementById(id).textContent,
    flushFrames: () => frames.splice(0).forEach((callback) => callback()),
    frameCount: () => frames.length,
    emit(type, properties) {
      const event = new window.Event(type);
      Object.assign(event, properties);
      window.dispatchEvent(event);
    },
  };
}

describe('application', () => {
  it('reports an unsupported browser', () => {
    const browser = createBrowser({ DeviceOrientationEvent: undefined });
    startApp(browser.window);
    assert.match(browser.text('status'), /does not expose/);
  });

  it('reports an insecure context', () => {
    const browser = createBrowser({ isSecureContext: false });
    startApp(browser.window);
    assert.match(browser.text('status'), /secure context/);
  });

  it('renders orientation readings', () => {
    const browser = createBrowser();
    startApp(browser.window);
    browser.emit('deviceorientation', { absolute: true, alpha: 10, beta: 45, gamma: 5 });
    browser.flushFrames();
    assert.equal(browser.text('absolute'), 'Yes');
    assert.equal(browser.text('alpha'), '10.0°');
    assert.equal(browser.text('beta'), '45.0°');
    assert.equal(browser.text('gamma'), '5.0°');
    assert.equal(browser.text('tilt'), 'top raised');
  });

  it('coalesces bursts of events into one frame using the latest reading', () => {
    const browser = createBrowser();
    startApp(browser.window);
    browser.emit('deviceorientation', { alpha: 1, beta: 1, gamma: 1 });
    browser.emit('deviceorientation', { alpha: 2, beta: 2, gamma: 2 });
    browser.emit('deviceorientation', { alpha: 3, beta: 3, gamma: 3 });
    assert.equal(browser.frameCount(), 1);
    browser.flushFrames();
    assert.equal(browser.text('alpha'), '3.0°');
  });

  it('marks the gyroscope as detected on non-zero rotation', () => {
    const browser = createBrowser();
    startApp(browser.window);
    assert.equal(browser.text('gyroscope'), 'Not detected');
    browser.emit('devicemotion', { rotationRate: { alpha: 1, beta: 0, gamma: 0 } });
    assert.equal(browser.text('gyroscope'), 'Detected');
    assert.equal(browser.window.document.getElementById('gyroscope').dataset.detected, 'true');
  });

  it('survives motion events without rotation data', () => {
    const browser = createBrowser();
    startApp(browser.window);
    browser.emit('devicemotion', { rotationRate: null });
    assert.equal(browser.text('gyroscope'), 'Not detected');
  });

  it('renders hostile event values as inert text', () => {
    const browser = createBrowser();
    startApp(browser.window);
    browser.emit('deviceorientation', { alpha: '<img src=x onerror=alert(1)>', beta: 0, gamma: 0 });
    browser.flushFrames();
    assert.equal(browser.text('alpha'), 'n/a');
    assert.equal(browser.window.document.querySelector('dd img'), null);
  });

  it('waits for a user gesture before requesting permission', async () => {
    let requests = 0;
    const browser = createBrowser({
      DeviceOrientationEvent: {
        requestPermission: async () => {
          requests += 1;
          return 'granted';
        },
      },
    });
    startApp(browser.window);
    const button = browser.window.document.getElementById('enable-sensors');
    assert.equal(requests, 0);
    assert.equal(button.hidden, false);
    button.click();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(requests, 1);
    assert.equal(button.hidden, true);
    assert.match(browser.text('status'), /Listening/);
  });

  it('reports a denied permission and does not listen', async () => {
    const browser = createBrowser({
      DeviceOrientationEvent: { requestPermission: async () => 'denied' },
    });
    startApp(browser.window);
    browser.window.document.getElementById('enable-sensors').click();
    await new Promise((resolve) => setImmediate(resolve));
    assert.match(browser.text('status'), /denied/);
    browser.emit('deviceorientation', { alpha: 10, beta: 10, gamma: 10 });
    assert.equal(browser.frameCount(), 0);
  });

  it('requests permission once when the button is clicked repeatedly', async () => {
    let requests = 0;
    const browser = createBrowser({
      DeviceOrientationEvent: {
        requestPermission: async () => {
          requests += 1;
          return 'granted';
        },
      },
    });
    startApp(browser.window);
    const button = browser.window.document.getElementById('enable-sensors');
    button.click();
    button.click();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(requests, 1);
  });

  it('does not start listening when stopped during a pending permission request', async () => {
    let grant;
    const browser = createBrowser({
      DeviceOrientationEvent: {
        requestPermission: () => new Promise((resolve) => {
          grant = resolve;
        }),
      },
    });
    const app = startApp(browser.window);
    browser.window.document.getElementById('enable-sensors').click();
    app.stop();
    grant('granted');
    await new Promise((resolve) => setImmediate(resolve));
    browser.emit('deviceorientation', { alpha: 10, beta: 10, gamma: 10 });
    assert.equal(browser.frameCount(), 0);
    assert.doesNotMatch(browser.text('status'), /Listening/);
  });

  it('wraps a heading that rounds to 360 degrees', () => {
    const browser = createBrowser();
    startApp(browser.window);
    browser.emit('deviceorientation', { alpha: 359.97, beta: 1, gamma: 1 });
    browser.flushFrames();
    assert.equal(browser.text('alpha'), '0.0°');
  });

  it('labels a device lying face down', () => {
    const browser = createBrowser();
    startApp(browser.window);
    browser.emit('deviceorientation', { alpha: 0, beta: 179, gamma: 1 });
    browser.flushFrames();
    assert.equal(browser.text('tilt'), 'face down');
  });

  it('stops listening after stop is called', () => {
    const browser = createBrowser();
    const app = startApp(browser.window);
    app.stop();
    browser.emit('deviceorientation', { alpha: 10, beta: 10, gamma: 10 });
    assert.equal(browser.frameCount(), 0);
  });

  it('ships a restrictive content security policy and no inline code', () => {
    const { document } = new JSDOM(html).window;
    const policy = document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
    assert.match(policy, /default-src 'none'/);
    assert.match(policy, /script-src 'self'/);
    assert.equal(policy.includes('unsafe'), false);
    assert.equal(document.querySelectorAll('script:not([src])').length, 0);
    assert.equal(document.querySelectorAll('[onclick]').length, 0);
    assert.equal(document.documentElement.lang, 'en');
  });
});
