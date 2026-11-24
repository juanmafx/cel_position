import { describeTilt, formatAngle, formatHeading } from '../domain/orientation.js';

export function createDashboard(document) {
  const element = (id) => document.getElementById(id);
  const status = element('status');
  const gyroscope = element('gyroscope');
  const button = element('enable-sensors');
  const absolute = element('absolute');
  const alpha = element('alpha');
  const beta = element('beta');
  const gamma = element('gamma');
  const tilt = element('tilt');
  let permissionHandler = null;

  return {
    renderStatus(message) {
      status.textContent = message;
    },
    renderGyroscope(isDetected) {
      gyroscope.dataset.detected = String(isDetected);
      gyroscope.textContent = isDetected ? 'Detected' : 'Not detected';
    },
    renderOrientation(reading) {
      absolute.textContent = reading.absolute ? 'Yes' : 'No';
      alpha.textContent = formatHeading(reading.alpha);
      beta.textContent = formatAngle(reading.beta);
      gamma.textContent = formatAngle(reading.gamma);
      tilt.textContent = describeTilt(reading);
    },
    showPermissionButton(onRequest) {
      permissionHandler = onRequest;
      button.hidden = false;
      button.addEventListener('click', permissionHandler);
    },
    hidePermissionButton() {
      button.hidden = true;
      if (permissionHandler) {
        button.removeEventListener('click', permissionHandler);
        permissionHandler = null;
      }
    },
  };
}
