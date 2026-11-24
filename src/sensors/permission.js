export function getSensorAvailability(browserWindow) {
  const orientationEvent = browserWindow.DeviceOrientationEvent;
  if (!orientationEvent) {
    return 'unsupported';
  }
  if (browserWindow.isSecureContext === false) {
    return 'insecure';
  }
  return typeof orientationEvent.requestPermission === 'function' ? 'permission' : 'ready';
}

export async function requestSensorAccess(browserWindow) {
  try {
    const { DeviceOrientationEvent: orientation, DeviceMotionEvent: motion } = browserWindow;
    const states = await Promise.all([
      orientation.requestPermission(),
      typeof motion?.requestPermission === 'function' ? motion.requestPermission() : 'granted',
    ]);
    return states.every((state) => state === 'granted') ? 'granted' : 'denied';
  } catch {
    return 'failed';
  }
}
