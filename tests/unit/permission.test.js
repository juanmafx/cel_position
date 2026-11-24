import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getSensorAvailability, requestSensorAccess } from '../../src/sensors/permission.js';

describe('getSensorAvailability', () => {
  it('reports unsupported without the event constructor', () => {
    assert.equal(getSensorAvailability({ isSecureContext: true }), 'unsupported');
  });

  it('reports insecure outside a secure context', () => {
    assert.equal(
      getSensorAvailability({ isSecureContext: false, DeviceOrientationEvent: class {} }),
      'insecure',
    );
  });

  it('reports ready when no permission API exists', () => {
    assert.equal(
      getSensorAvailability({ isSecureContext: true, DeviceOrientationEvent: class {} }),
      'ready',
    );
  });

  it('reports permission when the permission API exists', () => {
    const DeviceOrientationEvent = { requestPermission: async () => 'granted' };
    assert.equal(
      getSensorAvailability({ isSecureContext: true, DeviceOrientationEvent }),
      'permission',
    );
  });
});

describe('requestSensorAccess', () => {
  const grant = async () => 'granted';
  const deny = async () => 'denied';

  it('grants when both sensors are granted', async () => {
    const result = await requestSensorAccess({
      DeviceOrientationEvent: { requestPermission: grant },
      DeviceMotionEvent: { requestPermission: grant },
    });
    assert.equal(result, 'granted');
  });

  it('issues both requests synchronously to stay inside the user gesture', () => {
    const calls = [];
    const record = (name) => () => {
      calls.push(name);
      return Promise.resolve('granted');
    };
    const pending = requestSensorAccess({
      DeviceOrientationEvent: { requestPermission: record('orientation') },
      DeviceMotionEvent: { requestPermission: record('motion') },
    });
    assert.deepEqual(calls, ['orientation', 'motion']);
    return pending;
  });

  it('grants when the motion API has no permission gate', async () => {
    const result = await requestSensorAccess({
      DeviceOrientationEvent: { requestPermission: grant },
    });
    assert.equal(result, 'granted');
  });

  it('denies when orientation is denied', async () => {
    const result = await requestSensorAccess({
      DeviceOrientationEvent: { requestPermission: deny },
      DeviceMotionEvent: { requestPermission: grant },
    });
    assert.equal(result, 'denied');
  });

  it('denies when motion is denied', async () => {
    const result = await requestSensorAccess({
      DeviceOrientationEvent: { requestPermission: grant },
      DeviceMotionEvent: { requestPermission: deny },
    });
    assert.equal(result, 'denied');
  });

  it('reports failure when the request throws', async () => {
    const result = await requestSensorAccess({
      DeviceOrientationEvent: {
        requestPermission: async () => {
          throw new Error('gesture required');
        },
      },
    });
    assert.equal(result, 'failed');
  });
});
