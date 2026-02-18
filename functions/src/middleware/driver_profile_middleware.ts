import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export async function requireDriverProfile(db: Firestore, uid: string): Promise<void> {
  const driverSnap = await db.collection('drivers').doc(uid).get();
  if (!driverSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'Driver profile bulunamadi. Lutfen profilini tamamla.',
    );
  }
}
