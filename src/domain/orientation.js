const FLAT_THRESHOLD_DEGREES = 15;
const FACE_DOWN_BETA_DEGREES = 180 - FLAT_THRESHOLD_DEGREES;
const FULL_TURN_DEGREES = 360;

const ANGLE_RANGES = {
  alpha: [0, 360],
  beta: [-180, 180],
  gamma: [-90, 90],
};

function readAngle(value, [minimum, maximum]) {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

export function normalizeOrientation(event) {
  return {
    absolute: event?.absolute === true,
    alpha: readAngle(event?.alpha, ANGLE_RANGES.alpha),
    beta: readAngle(event?.beta, ANGLE_RANGES.beta),
    gamma: readAngle(event?.gamma, ANGLE_RANGES.gamma),
  };
}

export function hasRotationData(event) {
  const rate = event?.rotationRate;
  return [rate?.alpha, rate?.beta, rate?.gamma]
    .some((value) => Number.isFinite(value) && value !== 0);
}

export function formatAngle(value) {
  if (value === null || value === undefined) {
    return 'n/a';
  }
  const text = value.toFixed(1);
  return `${text === '-0.0' ? '0.0' : text}°`;
}

export function formatHeading(value) {
  if (value === null || value === undefined) {
    return 'n/a';
  }
  return formatAngle(Number(value.toFixed(1)) % FULL_TURN_DEGREES);
}

export function describeTilt({ beta, gamma }) {
  if (beta === null || gamma === null) {
    return 'unknown';
  }
  if (Math.abs(beta) < FLAT_THRESHOLD_DEGREES && Math.abs(gamma) < FLAT_THRESHOLD_DEGREES) {
    return 'flat';
  }
  if (Math.abs(beta) > FACE_DOWN_BETA_DEGREES && Math.abs(gamma) < FLAT_THRESHOLD_DEGREES) {
    return 'face down';
  }
  if (Math.abs(beta) >= Math.abs(gamma)) {
    return beta > 0 ? 'top raised' : 'top lowered';
  }
  return gamma > 0 ? 'right side lowered' : 'left side lowered';
}
