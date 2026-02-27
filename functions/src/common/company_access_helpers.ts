import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { pickString } from './runtime_value_helpers.js';
import { asRecord } from './type_guards.js';

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';

export function createCompanyAccessHelpers(db: Firestore) {
  async function requireActiveCompanyMemberRole(
    companyId: string,
    uid: string,
  ): Promise<CompanyMemberRole> {
    const memberSnap = await db.collection('companies').doc(companyId).collection('members').doc(uid).get();
    if (!memberSnap.exists) {
      throw new HttpsError('permission-denied', 'Bu company icin member kaydi bulunamadi.');
    }
    const memberData = asRecord(memberSnap.data()) ?? {};
    const status = pickString(memberData, 'status');
    if (status !== 'active') {
      throw new HttpsError('permission-denied', 'Company member status active degil.');
    }
    const role = pickString(memberData, 'role');
    if (role !== 'owner' && role !== 'admin' && role !== 'dispatcher' && role !== 'viewer') {
      throw new HttpsError('failed-precondition', 'Company member role gecersiz.');
    }
    return role;
  }

  function requireCompanyVehicleWriteRole(role: CompanyMemberRole) {
    if (role === 'owner' || role === 'admin' || role === 'dispatcher') {
      return;
    }
    throw new HttpsError('permission-denied', 'Bu islem icin company vehicle write yetkisi gerekli.');
  }

  function requireCompanyRouteWriteRole(role: CompanyMemberRole) {
    if (role === 'owner' || role === 'admin' || role === 'dispatcher') {
      return;
    }
    throw new HttpsError('permission-denied', 'Bu islem icin company route write yetkisi gerekli.');
  }

  function normalizeVehiclePlate(input: string): { plate: string; plateNormalized: string } {
    const plate = input.trim().toUpperCase().replace(/\s+/g, ' ');
    const plateNormalized = plate.replace(/\s+/g, '');
    if (plateNormalized.length < 4) {
      throw new HttpsError('invalid-argument', 'plate minimum 4 karakter olmalidir.');
    }
    return { plate, plateNormalized };
  }

  function normalizeVehicleTextNullable(input: string | null | undefined): string | null {
    if (input == null) {
      return null;
    }
    const value = input.trim();
    return value.length > 0 ? value : null;
  }

  async function assertCompanyMembersExistAndActive(companyId: string, uids: readonly string[]): Promise<void> {
    if (uids.length === 0) {
      return;
    }
    const uniqueUids = Array.from(new Set(uids));
    const snapshots = await Promise.all(
      uniqueUids.map((uid) => db.collection('companies').doc(companyId).collection('members').doc(uid).get()),
    );

    const missingOrInactive = snapshots.find((snap, index) => {
      if (!snap.exists) {
        return uniqueUids[index];
      }
      const data = asRecord(snap.data()) ?? {};
      return pickString(data, 'status') !== 'active' ? uniqueUids[index] : null;
    });

    if (missingOrInactive != null) {
      throw new HttpsError(
        'failed-precondition',
        'authorizedDriverIds icinde company member olmayan veya aktif olmayan uid var.',
      );
    }
  }

  return {
    requireActiveCompanyMemberRole,
    requireCompanyVehicleWriteRole,
    requireCompanyRouteWriteRole,
    normalizeVehiclePlate,
    normalizeVehicleTextNullable,
    assertCompanyMembersExistAndActive,
  };
}
