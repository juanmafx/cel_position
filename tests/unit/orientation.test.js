import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  describeTilt,
  formatAngle,
  formatHeading,
  hasRotationData,
  normalizeOrientation,
} from '../../src/domain/orientation.js';

describe('normalizeOrientation', () => {
  it('keeps angles inside their specified ranges', () => {
    assert.deepEqual(
      normalizeOrientation({ absolute: true, alpha: 359.5, beta: -179, gamma: 89 }),
      { absolute: true, alpha: 359.5, beta: -179, gamma: 89 },
    );
  });

  it('accepts the inclusive range boundaries', () => {
    assert.deepEqual(
      normalizeOrientation({ absolute: false, alpha: 360, beta: 180, gamma: -90 }),
      { absolute: false, alpha: 360, beta: 180, gamma: -90 },
    );
  });

  for (const invalid of [null, undefined, Number.NaN, Infinity, '12', 361, -1]) {
    it(`rejects alpha value ${String(invalid)}`, () => {
      assert.equal(normalizeOrientation({ alpha: invalid }).alpha, null);
    });
  }

  it('rejects beta and gamma outside their ranges', () => {
    const reading = normalizeOrientation({ beta: 181, gamma: 91 });
    assert.equal(reading.beta, null);
    assert.equal(reading.gamma, null);
  });

  it('treats only a strict true as absolute', () => {
    assert.equal(normalizeOrientation({ absolute: 'true' }).absolute, false);
  });

  it('returns an empty reading for a missing event', () => {
    assert.deepEqual(normalizeOrientation(null), {
      absolute: false,
      alpha: null,
      beta: null,
      gamma: null,
    });
  });
});

describe('hasRotationData', () => {
  it('detects any non-zero axis', () => {
    assert.equal(hasRotationData({ rotationRate: { alpha: 0, beta: 0.2, gamma: 0 } }), true);
  });

  it('is false for zero rates', () => {
    assert.equal(hasRotationData({ rotationRate: { alpha: 0, beta: 0, gamma: 0 } }), false);
  });

  it('does not throw when rotationRate is null', () => {
    assert.equal(hasRotationData({ rotationRate: null }), false);
  });

  for (const invalid of ['1', Number.NaN, Infinity, true, {}]) {
    it(`ignores non-numeric rate ${String(invalid)}`, () => {
      assert.equal(hasRotationData({ rotationRate: { alpha: invalid, beta: 0, gamma: 0 } }), false);
    });
  }
});

describe('formatAngle', () => {
  it('formats to one decimal place with a degree sign', () => {
    assert.equal(formatAngle(12.345), '12.3°');
  });

  it('keeps zero as a real value', () => {
    assert.equal(formatAngle(0), '0.0°');
  });

  it('renders missing values as n/a', () => {
    assert.equal(formatAngle(null), 'n/a');
  });

  it('does not render negative zero', () => {
    assert.equal(formatAngle(-0.04), '0.0°');
  });
});

describe('formatHeading', () => {
  const cases = [
    [12.34, '12.3°'],
    [359.94, '359.9°'],
    [359.97, '0.0°'],
    [360, '0.0°'],
    [null, 'n/a'],
  ];

  for (const [value, expected] of cases) {
    it(`formats heading ${value} as ${expected}`, () => {
      assert.equal(formatHeading(value), expected);
    });
  }
});

describe('describeTilt', () => {
  const cases = [
    [{ beta: 2, gamma: -3 }, 'flat'],
    [{ beta: 45, gamma: 10 }, 'top raised'],
    [{ beta: -45, gamma: 10 }, 'top lowered'],
    [{ beta: 10, gamma: 45 }, 'right side lowered'],
    [{ beta: 10, gamma: -45 }, 'left side lowered'],
    [{ beta: null, gamma: 10 }, 'unknown'],
    [{ beta: 10, gamma: null }, 'unknown'],
    [{ beta: 179, gamma: 1 }, 'face down'],
    [{ beta: -175, gamma: -5 }, 'face down'],
    [{ beta: 165, gamma: 0 }, 'top raised'],
    [{ beta: 170, gamma: 40 }, 'top raised'],
  ];

  for (const [reading, expected] of cases) {
    it(`classifies beta ${reading.beta} gamma ${reading.gamma} as ${expected}`, () => {
      assert.equal(describeTilt(reading), expected);
    });
  }
});
