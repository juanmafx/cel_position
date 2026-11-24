export function subscribeToSensors(target, { onOrientation, onMotion }) {
  const listenerOptions = { passive: true };
  target.addEventListener('deviceorientation', onOrientation, listenerOptions);
  target.addEventListener('devicemotion', onMotion, listenerOptions);

  return () => {
    target.removeEventListener('deviceorientation', onOrientation, listenerOptions);
    target.removeEventListener('devicemotion', onMotion, listenerOptions);
  };
}
