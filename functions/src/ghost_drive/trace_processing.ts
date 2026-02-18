export interface GhostTracePoint {
  lat: number;
  lng: number;
  accuracy: number;
  sampledAtMs: number;
}

export interface GhostTraceProcessingConfig {
  minPoints: number;
  maxPoints: number;
  maxSegmentDistanceMeters: number;
  simplifyEpsilonMeters: number;
  simplifiedMaxPoints: number;
  maxPolylineChars: number;
}

export interface ProcessedGhostTrace {
  sanitizedTrace: GhostTracePoint[];
  simplifiedTrace: GhostTracePoint[];
  encodedPolyline: string;
}

export class GhostTraceValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GhostTraceValidationError';
  }
}

export const defaultGhostTraceProcessingConfig: GhostTraceProcessingConfig = {
  minPoints: 8,
  maxPoints: 5000,
  maxSegmentDistanceMeters: 500,
  simplifyEpsilonMeters: 20,
  simplifiedMaxPoints: 300,
  maxPolylineChars: 12000,
};

export function processGhostTrace(
  inputTrace: readonly GhostTracePoint[],
  config: GhostTraceProcessingConfig = defaultGhostTraceProcessingConfig,
): ProcessedGhostTrace {
  if (inputTrace.length < config.minPoints) {
    throw new GhostTraceValidationError(
      'GHOST_TRACE_MIN_POINTS',
      `Trace minimum ${config.minPoints} nokta icermelidir.`,
    );
  }

  const sorted = [...inputTrace]
    .slice(0, config.maxPoints)
    .sort((a, b) => a.sampledAtMs - b.sampledAtMs);

  const sanitized = sanitizeTrace(sorted, config.maxSegmentDistanceMeters);
  if (sanitized.length < config.minPoints) {
    throw new GhostTraceValidationError(
      'GHOST_TRACE_SANITIZED_TOO_SHORT',
      'Sanitize sonrasi trace yetersiz kaldi.',
    );
  }

  let simplified = douglasPeucker(sanitized, config.simplifyEpsilonMeters);
  if (simplified.length > config.simplifiedMaxPoints) {
    simplified = downsampleByStride(simplified, config.simplifiedMaxPoints);
  }

  const encodedPolyline = encodeTracePolyline(simplified);
  if (encodedPolyline.length > config.maxPolylineChars) {
    throw new GhostTraceValidationError(
      'GHOST_TRACE_POLYLINE_TOO_LARGE',
      `Polyline boyutu limiti asti (${encodedPolyline.length}).`,
    );
  }

  return {
    sanitizedTrace: sanitized,
    simplifiedTrace: simplified,
    encodedPolyline,
  };
}

export function encodeTracePolyline(points: readonly GhostTracePoint[]): string {
  if (points.length === 0) {
    return '';
  }

  let previousLat = 0;
  let previousLng = 0;
  finalBuffer.length = 0;

  for (const point of points) {
    const currentLat = Math.round(point.lat * 1e5);
    const currentLng = Math.round(point.lng * 1e5);
    appendSignedValue(currentLat - previousLat);
    appendSignedValue(currentLng - previousLng);
    previousLat = currentLat;
    previousLng = currentLng;
  }

  return finalBuffer.join('');
}

const finalBuffer: string[] = [];

function appendSignedValue(value: number): void {
  let encodedValue = value < 0 ? ~(value << 1) : value << 1;
  while (encodedValue >= 0x20) {
    const nextValue = (0x20 | (encodedValue & 0x1f)) + 63;
    finalBuffer.push(String.fromCharCode(nextValue));
    encodedValue >>= 5;
  }
  finalBuffer.push(String.fromCharCode(encodedValue + 63));
}

function sanitizeTrace(
  points: readonly GhostTracePoint[],
  maxSegmentDistanceMeters: number,
): GhostTracePoint[] {
  const output: GhostTracePoint[] = [];

  for (const point of points) {
    if (!isFinite(point.lat) || !isFinite(point.lng) || !isFinite(point.accuracy)) {
      continue;
    }
    if (point.accuracy <= 0 || point.accuracy > 200) {
      continue;
    }

    const last = output[output.length - 1];
    if (last) {
      const isDuplicate =
        Math.abs(last.lat - point.lat) < 1e-8 &&
        Math.abs(last.lng - point.lng) < 1e-8 &&
        last.sampledAtMs === point.sampledAtMs;
      if (isDuplicate) {
        continue;
      }

      const segmentDistance = haversineMeters(last.lat, last.lng, point.lat, point.lng);
      if (segmentDistance > maxSegmentDistanceMeters) {
        continue;
      }
    }

    output.push(point);
  }

  return output;
}

function douglasPeucker(
  points: readonly GhostTracePoint[],
  epsilonMeters: number,
): GhostTracePoint[] {
  if (points.length <= 2) {
    return [...points];
  }

  let maxDistance = 0;
  let index = 0;

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return [...points];
  }

  for (let i = 1; i < points.length - 1; i += 1) {
    const point = points[i];
    if (!point) {
      continue;
    }
    const distance = perpendicularDistanceMeters(point, first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance <= epsilonMeters) {
    return [first, last];
  }

  const left = douglasPeucker(points.slice(0, index + 1), epsilonMeters);
  const right = douglasPeucker(points.slice(index), epsilonMeters);
  return [...left.slice(0, -1), ...right];
}

function downsampleByStride(
  points: readonly GhostTracePoint[],
  maxPoints: number,
): GhostTracePoint[] {
  if (points.length <= maxPoints) {
    return [...points];
  }
  const stride = Math.ceil(points.length / maxPoints);
  const output: GhostTracePoint[] = [];

  for (let i = 0; i < points.length; i += stride) {
    const point = points[i];
    if (point) {
      output.push(point);
    }
  }

  const last = points[points.length - 1];
  if (last && output[output.length - 1] !== last) {
    output.push(last);
  }

  return output;
}

function perpendicularDistanceMeters(
  point: GhostTracePoint,
  lineStart: GhostTracePoint,
  lineEnd: GhostTracePoint,
): number {
  const avgLatRad = ((lineStart.lat + lineEnd.lat) / 2) * (Math.PI / 180);
  const meterPerLng = 111_320 * Math.cos(avgLatRad);
  const meterPerLat = 110_540;

  const x1 = lineStart.lng * meterPerLng;
  const y1 = lineStart.lat * meterPerLat;
  const x2 = lineEnd.lng * meterPerLng;
  const y2 = lineEnd.lat * meterPerLat;
  const xp = point.lng * meterPerLng;
  const yp = point.lat * meterPerLat;

  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
    return Math.hypot(xp - x1, yp - y1);
  }

  const t = ((xp - x1) * dx + (yp - y1) * dy) / (dx * dx + dy * dy);
  const tClamped = Math.max(0, Math.min(1, t));
  const projectionX = x1 + tClamped * dx;
  const projectionY = y1 + tClamped * dy;

  return Math.hypot(xp - projectionX, yp - projectionY);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6_371_000 * c;
}
