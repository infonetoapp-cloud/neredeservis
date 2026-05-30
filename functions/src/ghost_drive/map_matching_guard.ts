import type { Firestore } from 'firebase-admin/firestore';

import type { GhostTracePoint } from './trace_processing.js';

export interface MapMatchingResult {
  tracePoints: GhostTracePoint[];
  fallbackUsed: boolean;
  source: 'map_matching' | 'fallback';
  confidence: number;
}

export async function applyMapMatchingWithGuard({
  db,
  tracePoints,
}: {
  db: Firestore;
  tracePoints: readonly GhostTracePoint[];
}): Promise<MapMatchingResult> {
  const flagDoc = await db.collection('_runtime_flags').doc('map_matching').get();
  if (!flagDoc.exists) {
    return {
      tracePoints: [...tracePoints],
      fallbackUsed: true,
      source: 'fallback',
      confidence: 0,
    };
  }

  const config = flagDoc.data();
  if (!config || !config.enabled) {
    return {
      tracePoints: [...tracePoints],
      fallbackUsed: true,
      source: 'fallback',
      confidence: 0,
    };
  }

  const usageRef = db.collection('_runtime_flags').doc('map_matching_usage');
  let currentCount = 0;
  
  await db.runTransaction(async (transaction) => {
    const usageDoc = await transaction.get(usageRef);
    if (!usageDoc.exists) {
      currentCount = 1;
      transaction.set(usageRef, { count: 1 });
    } else {
      const data = usageDoc.data();
      currentCount = (data?.count || 0) + 1;
      transaction.update(usageRef, { count: currentCount });
    }
  });

  const maxRequests = config.monthlyRequestMax || 0;
  if (currentCount > maxRequests) {
    return {
      tracePoints: [...tracePoints],
      fallbackUsed: true,
      source: 'fallback',
      confidence: 0,
    };
  }

  return {
    tracePoints: [...tracePoints],
    fallbackUsed: false,
    source: 'map_matching',
    confidence: 0.5,
  };
}
