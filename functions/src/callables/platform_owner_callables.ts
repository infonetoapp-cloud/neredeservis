import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

import { apiOk } from '../common/api_response.js';
import type {
  PlatformCompanyListItem,
  PlatformCompanyMemberItem,
  PlatformCompanyRouteItem,
  PlatformCompanyVehicleItem,
  PlatformCreateCompanyOutput,
  PlatformGetCompanyDetailOutput,
  PlatformListCompaniesOutput,
  PlatformSetCompanyStatusOutput,
  PlatformSetVehicleLimitOutput,
} from '../common/output_contract_types.js';
import { pickString } from '../common/runtime_value_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous, type AuthContext } from '../middleware/auth_middleware.js';

// ─── Email helper (Firebase Auth REST API) ────────────────────────────────────

/**
 * Firebase'in kendi e-posta altyapısını kullanarak şifre belirleme maili gönderir.
 * FIREBASE_WEB_API_KEY env değişkeni zorunludur.
 * Firebase Console → Authentication → Templates → Password reset →
 *   "Customize action URL" = https://app.neredeservis.app/set-password
 * şeklinde ayarlı olmalı ki link doğrudan uygulamamıza gelsin.
 */
async function sendPasswordSetupEmail(email: string): Promise<void> {
  const webApiKey = (process.env.APP_WEB_API_KEY ?? '').trim();
  if (!webApiKey) {
    // Key yoksa sessizce geç — prod'da log'a düşer ama hata fırlatmaz
    console.warn('[sendPasswordSetupEmail] APP_WEB_API_KEY tanimlanmamis, mail gonderilmedi.');
    return;
  }

  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${webApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    },
  );

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    console.error('[sendPasswordSetupEmail] Firebase mail API hatasi:', resp.status, body);
    // Mail gonderilemese de company olusturmayı durdurmuyoruz
  }
}

// ─── Platform Owner Guard ─────────────────────────────────────────────────────

function requirePlatformOwner(auth: AuthContext): void {
  const ownerUid = (process.env.PLATFORM_OWNER_UID ?? '').trim();
  if (!ownerUid) {
    throw new HttpsError(
      'internal',
      'PLATFORM_OWNER_UID sunucu degiskeni tanimlanmamis. Firebase Functions env ayarlarini kontrol edin.',
    );
  }
  if (auth.uid !== ownerUid) {
    throw new HttpsError('permission-denied', 'Bu islem yalnizca platform sahibi tarafindan yapilabilir.');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertCompanyStatus(val: string | null): 'active' | 'suspended' {
  if (val === 'active' || val === 'suspended') return val;
  return 'active';
}

function pickNumber(data: Record<string, unknown>, key: string): number | null {
  const val = data[key];
  return typeof val === 'number' && Number.isFinite(val) ? val : null;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPlatformOwnerCallables({ db }: { db: Firestore }) {
  /**
   * Tüm şirketleri listeler. Yalnızca platform sahibi çağırabilir.
   */
  const platformListCompanies = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const companiesSnap = await db.collection('companies').orderBy('createdAt', 'desc').get();

    const items = await Promise.all(
      companiesSnap.docs.map(async (doc) => {
        const data = asRecord(doc.data()) ?? {};
        const companyId = doc.id;

        // Paralel subcollection sayımları
        const [membersSnap, vehiclesSnap, routesSnap] = await Promise.all([
          db.collection('companies').doc(companyId).collection('members').count().get(),
          db.collection('companies').doc(companyId).collection('vehicles').count().get(),
          db.collection('routes').where('companyId', '==', companyId).count().get(),
        ]);

        // Owner email'i bul: owner rolündeki aktif üye
        const ownerQuery = await db
          .collection('companies')
          .doc(companyId)
          .collection('members')
          .where('role', '==', 'owner')
          .limit(1)
          .get();

        let ownerEmail: string | null = null;
        let ownerUid: string | null = null;
        if (!ownerQuery.empty) {
          const ownerDoc = ownerQuery.docs[0];
          if (ownerDoc) {
            const ownerMemberData = asRecord(ownerDoc.data()) ?? {};
            ownerUid = ownerDoc.id;
            const ownerMemberEmail = pickString(ownerMemberData, 'email');
            if (ownerMemberEmail) {
              ownerEmail = ownerMemberEmail;
            } else {
              // Auth'dan çek
              try {
                const authUser = await getAuth().getUser(ownerUid);
                ownerEmail = authUser.email ?? null;
              } catch {
                // ignore — user might not exist yet
              }
            }
          }
        }

        return {
          companyId,
          name: pickString(data, 'name') ?? '(isimsiz)',
          status: assertCompanyStatus(pickString(data, 'status')),
          ownerEmail,
          ownerUid,
          vehicleLimit: pickNumber(data, 'vehicleLimit') ?? 0,
          vehicleCount: vehiclesSnap.data().count,
          memberCount: membersSnap.data().count,
          routeCount: routesSnap.data().count,
          createdAt: pickString(data, 'createdAt') ?? new Date().toISOString(),
        } satisfies PlatformCompanyListItem;
      }),
    );

    return apiOk<PlatformListCompaniesOutput>({ items });
  });

  /**
   * Tek bir şirketin detayını döner: üyeler, araçlar, rotalar.
   */
  const platformGetCompanyDetail = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const input = asRecord(request.data) ?? {};
    const companyId = pickString(input, 'companyId');
    if (!companyId) {
      throw new HttpsError('invalid-argument', 'companyId zorunludur.');
    }

    const [companySnap, membersSnap, vehiclesSnap, routesSnap] = await Promise.all([
      db.collection('companies').doc(companyId).get(),
      db.collection('companies').doc(companyId).collection('members').get(),
      db.collection('companies').doc(companyId).collection('vehicles').get(),
      db.collection('routes').where('companyId', '==', companyId).limit(100).get(),
    ]);

    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Sirket bulunamadi.');
    }

    const companyData = asRecord(companySnap.data()) ?? {};

    // Üyeler: Auth'dan display name / email çek
    const members = await Promise.all(
      membersSnap.docs.map(async (doc) => {
        const memberData = asRecord(doc.data()) ?? {};
        const uid = doc.id;
        let email: string | null = pickString(memberData, 'email');
        let displayName: string | null = pickString(memberData, 'displayName');

        if (!email || !displayName) {
          try {
            const authUser = await getAuth().getUser(uid);
            email = email ?? authUser.email ?? null;
            displayName = displayName ?? authUser.displayName ?? null;
          } catch {
            // ignore
          }
        }

        return {
          uid,
          email,
          displayName,
          role: pickString(memberData, 'role') ?? 'member',
          status: pickString(memberData, 'status') ?? 'active',
          joinedAt:
            pickString(memberData, 'acceptedAt') ??
            pickString(memberData, 'createdAt') ??
            new Date().toISOString(),
        } satisfies PlatformCompanyMemberItem;
      }),
    );

    // Araçlar
    const vehicles = vehiclesSnap.docs
      .map((doc) => {
        const d = asRecord(doc.data()) ?? {};
        return {
          vehicleId: doc.id,
          plate: pickString(d, 'plate') ?? '',
          brand: pickString(d, 'brand'),
          model: pickString(d, 'model'),
          capacity: pickNumber(d, 'capacity'),
          status: pickString(d, 'status') ?? 'active',
        } satisfies PlatformCompanyVehicleItem;
      })
      .filter((v) => v.plate.length > 0);

    // Rotalar
    const routes = routesSnap.docs.map((doc) => {
      const d = asRecord(doc.data()) ?? {};
      return {
        routeId: doc.id,
        name: pickString(d, 'name') ?? '(isimsiz rota)',
        stopCount: pickNumber(d as Record<string, unknown>, 'stopCount') ?? 0,
        isArchived: d['isArchived'] === true,
      } satisfies PlatformCompanyRouteItem;
    });

    // Owner UIDs
    const ownerMember = members.find((m) => m.role === 'owner');

    return apiOk<PlatformGetCompanyDetailOutput>({
      companyId,
      name: pickString(companyData, 'name') ?? '(isimsiz)',
      status: assertCompanyStatus(pickString(companyData, 'status')),
      ownerEmail: ownerMember?.email ?? null,
      ownerUid: ownerMember?.uid ?? null,
      vehicleLimit: pickNumber(companyData, 'vehicleLimit') ?? 0,
      createdAt: pickString(companyData, 'createdAt') ?? new Date().toISOString(),
      members,
      vehicles,
      routes,
    });
  });

  /**
   * Yeni şirket oluşturur, yetkili kullanıcıya Firebase davet linki gönderir.
   * Kullanıcı Firebase Auth'da yoksa oluşturulur.
   */
  const platformCreateCompany = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const input = asRecord(request.data) ?? {};
    const companyName = pickString(input, 'companyName')?.trim();
    const ownerEmailRaw = pickString(input, 'ownerEmail')?.trim().toLowerCase();
    const vehicleLimitRaw = input['vehicleLimit'];
    const vehicleLimit =
      typeof vehicleLimitRaw === 'number' && vehicleLimitRaw > 0 ? vehicleLimitRaw : 10;

    if (!companyName || companyName.length < 2) {
      throw new HttpsError('invalid-argument', 'companyName en az 2 karakter olmalidir.');
    }
    if (!ownerEmailRaw || !ownerEmailRaw.includes('@')) {
      throw new HttpsError('invalid-argument', 'Gecerli bir ownerEmail girilmelidir.');
    }

    const nowIso = new Date().toISOString();

    // Firebase Auth: Kullanıcıyı bul veya oluştur
    let ownerUid: string;
    try {
      const existing = await getAuth().getUserByEmail(ownerEmailRaw);
      ownerUid = existing.uid;
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? '';
      if (code === 'auth/user-not-found') {
        const created = await getAuth().createUser({
          email: ownerEmailRaw,
          emailVerified: false,
        });
        ownerUid = created.uid;
      } else {
        throw err;
      }
    }

    // Şifre sıfırlama linki oluştur (yetkili bu linki kullanarak şifresini belirlenir)
    const appBaseUrl = (process.env.APP_BASE_URL ?? 'https://app.neredeservis.app').trim();
    let passwordResetLink: string;
    try {
      const rawFirebaseLink = await getAuth().generatePasswordResetLink(ownerEmailRaw, {
        url: `${appBaseUrl}/login`,
      });
      // Firebase'in döndürdüğü linkteki oobCode'u alıp özel set-password sayfasına yönlendiriyoruz
      try {
        const linkUrl = new URL(rawFirebaseLink);
        const oobCode = linkUrl.searchParams.get('oobCode') ?? '';
        if (oobCode) {
          passwordResetLink = `${appBaseUrl}/set-password?oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(ownerEmailRaw)}`;
        } else {
          passwordResetLink = rawFirebaseLink;
        }
      } catch {
        passwordResetLink = rawFirebaseLink;
      }
    } catch {
      // Fallback: link üretimi başarısız olursa boş döndür, elle gönderilebilir
      passwordResetLink = '';
    }

    // Firestore: Şirket ve owner üye kaydı oluştur (transaction)
    let companyId = '';
    await db.runTransaction(async (tx) => {
      const companyRef = db.collection('companies').doc();
      companyId = companyRef.id;
      const memberRef = companyRef.collection('members').doc(ownerUid);
      const userMembershipRef = db
        .collection('users')
        .doc(ownerUid)
        .collection('company_memberships')
        .doc(companyId);

      tx.set(companyRef, {
        name: companyName,
        legalName: null,
        status: 'active',
        timezone: 'Europe/Istanbul',
        countryCode: 'TR',
        contactEmail: ownerEmailRaw,
        contactPhone: null,
        vehicleLimit,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdByPlatform: auth.uid,
      });

      tx.set(memberRef, {
        companyId,
        uid: ownerUid,
        role: 'owner',
        status: 'active',
        email: ownerEmailRaw,
        permissions: null,
        invitedBy: null,
        invitedAt: null,
        acceptedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      tx.set(userMembershipRef, {
        companyId,
        role: 'owner',
        status: 'active',
        joinedAt: nowIso,
        updatedAt: nowIso,
      });
    });

    // Davet e-postasını otomatik gönder (Firebase kendi mail altyapısını kullanır)
    await sendPasswordSetupEmail(ownerEmailRaw);

    return apiOk<PlatformCreateCompanyOutput>({
      companyId,
      ownerUid,
      ownerEmail: ownerEmailRaw,
      passwordResetLink,
      createdAt: nowIso,
    });
  });

  /**
   * Şirket araç limitini günceller.
   */
  const platformSetVehicleLimit = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const input = asRecord(request.data) ?? {};
    const companyId = pickString(input, 'companyId');
    const vehicleLimitRaw = input['vehicleLimit'];

    if (!companyId) {
      throw new HttpsError('invalid-argument', 'companyId zorunludur.');
    }
    if (typeof vehicleLimitRaw !== 'number' || vehicleLimitRaw < 0) {
      throw new HttpsError('invalid-argument', 'vehicleLimit sifirdan buyuk bir sayi olmalidir.');
    }

    const vehicleLimit = vehicleLimitRaw;
    const nowIso = new Date().toISOString();

    const companyRef = db.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Sirket bulunamadi.');
    }

    await companyRef.update({ vehicleLimit, updatedAt: nowIso });

    return apiOk<PlatformSetVehicleLimitOutput>({
      companyId,
      vehicleLimit,
      updatedAt: nowIso,
    });
  });

  /**
   * Şirket durumunu aktif/askıda olarak günceller.
   */
  const platformSetCompanyStatus = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const input = asRecord(request.data) ?? {};
    const companyId = pickString(input, 'companyId');
    const statusRaw = pickString(input, 'status');

    if (!companyId) {
      throw new HttpsError('invalid-argument', 'companyId zorunludur.');
    }
    if (statusRaw !== 'active' && statusRaw !== 'suspended') {
      throw new HttpsError('invalid-argument', 'status "active" veya "suspended" olmalidir.');
    }

    const status: 'active' | 'suspended' = statusRaw;
    const nowIso = new Date().toISOString();

    const companyRef = db.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Sirket bulunamadi.');
    }

    await companyRef.update({ status, updatedAt: nowIso });

    return apiOk<PlatformSetCompanyStatusOutput>({
      companyId,
      status,
      updatedAt: nowIso,
    });
  });

  /**
   * Mevcut bir şirket sahibi için yeni bir şifre belirleme linki üretir.
   */
  const platformResetOwnerPassword = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const input = asRecord(request.data) ?? {};
    const companyId = pickString(input, 'companyId');

    if (!companyId) {
      throw new HttpsError('invalid-argument', 'companyId zorunludur.');
    }

    const companyRef = db.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Sirket bulunamadi.');
    }

    const companyData = companySnap.data() as Record<string, unknown>;
    const ownerEmail = (companyData['contactEmail'] as string | undefined) ?? '';
    if (!ownerEmail) {
      throw new HttpsError('not-found', 'Sirket sahibinin e-postasi bulunamadi.');
    }

    const appBaseUrl = (process.env.APP_BASE_URL ?? 'https://app.neredeservis.app').trim();
    let loginLink: string;
    try {
      const rawFirebaseLink = await getAuth().generatePasswordResetLink(ownerEmail, {
        url: `${appBaseUrl}/login`,
      });
      try {
        const linkUrl = new URL(rawFirebaseLink);
        const oobCode = linkUrl.searchParams.get('oobCode') ?? '';
        if (oobCode) {
          loginLink = `${appBaseUrl}/set-password?oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(ownerEmail)}`;
        } else {
          loginLink = rawFirebaseLink;
        }
      } catch {
        loginLink = rawFirebaseLink;
      }
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? '';
      throw new HttpsError('internal', `Sifre sifirlama linki olusturulamadi: ${code}`);
    }

    // Şirket sahibine otomatik e-posta gönder
    await sendPasswordSetupEmail(ownerEmail);

    return apiOk<{ loginLink: string }>({ loginLink });
  });

  return {
    platformListCompanies,
    platformGetCompanyDetail,
    platformCreateCompany,
    platformSetVehicleLimit,
    platformSetCompanyStatus,
    platformResetOwnerPassword,
  };
}
