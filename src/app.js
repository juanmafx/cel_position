import { hasRotationData, normalizeOrientation } from './domain/orientation.js';
import { getSensorAvailability, requestSensorAccess } from './sensors/permission.js';
import { subscribeToSensors } from './sensors/sensor-stream.js';
import { createDashboard } from './ui/dashboard.js';

const STATUS_MESSAGES = {
  unsupported: 'This browser does not expose device orientation events.',
  insecure: 'Sensors require a secure context. Open this page over HTTPS or localhost.',
  permission: 'Select "Enable sensors" to grant motion access.',
  denied: 'Motion access was denied. Allow it in the browser settings and reload.',
  failed: 'Motion access could not be requested. Reload and try again.',
  listening: 'Listening for sensor data.',
};

export function startApp(browserWindow) {
  const dashboard = createDashboard(browserWindow.document);
  let latestReading = null;
  let frameRequested = false;
  let unsubscribe = null;
  let permissionPending = false;
  let stopped = false;

  const flushFrame = () => {
    frameRequested = false;
    dashboard.renderOrientation(latestReading);
  };

  const handleOrientation = (event) => {
    latestReading = normalizeOrientation(event);
    if (!frameRequested) {
      frameRequested = true;
      browserWindow.requestAnimationFrame(flushFrame);
    }
  };

  const handleMotion = (event) => {
    if (hasRotationData(event)) {
      dashboard.renderGyroscope(true);
    }
  };

  const listen = () => {
    unsubscribe = subscribeToSensors(browserWindow, {
      onOrientation: handleOrientation,
      onMotion: handleMotion,
    });
    dashboard.hidePermissionButton();
    dashboard.renderStatus(STATUS_MESSAGES.listening);
  };

  const availability = getSensorAvailability(browserWindow);

  if (availability === 'ready') {
    listen();
  } else if (availability === 'permission') {
    dashboard.renderStatus(STATUS_MESSAGES.permission);
    dashboard.showPermissionButton(async () => {
      if (permissionPending || stopped) {
        return;
      }
      permissionPending = true;
      const result = await requestSensorAccess(browserWindow);
      permissionPending = false;
      if (stopped) {
        return;
      }
      if (result === 'granted') {
        listen();
      } else {
        dashboard.renderStatus(STATUS_MESSAGES[result]);
      }
    });
  } else {
    dashboard.renderStatus(STATUS_MESSAGES[availability]);
  }

  return {
    stop() {
      stopped = true;
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}
