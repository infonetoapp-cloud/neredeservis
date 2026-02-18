import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/guest_session_entity.dart';
import 'package:neredeservis/features/domain/entities/local_ownership_entity.dart';
import 'package:neredeservis/features/domain/mappers/guest_session_mapper.dart';
import 'package:neredeservis/features/domain/models/guest_session_model.dart';

void main() {
  test('GuestSessionModel.fromMap + toEntity maps guest session contract', () {
    final model = GuestSessionModel.fromMap(
      <String, dynamic>{
        'routeId': 'route_1',
        'guestUid': 'guest_1',
        'expiresAt': '2026-02-19T08:00:00.000Z',
        'status': 'active',
        'createdAt': '2026-02-18T08:00:00.000Z',
      },
      sessionId: 'session_1',
    );

    final entity = model.toEntity();

    expect(entity.sessionId, 'session_1');
    expect(entity.status, GuestSessionStatus.active);
    expect(entity.ownership, isNull);
  });

  test('toEntity includes optional local ownership model', () {
    final model = GuestSessionModel.fromMap(
      <String, dynamic>{
        'routeId': 'route_2',
        'guestUid': 'guest_2',
        'expiresAt': '2026-02-19T08:00:00.000Z',
        'status': 'revoked',
        'createdAt': '2026-02-18T08:00:00.000Z',
        'ownerUid': 'uid_new',
        'previousOwnerUid': 'uid_old',
        'migratedAt': '2026-02-18T09:00:00.000Z',
      },
      sessionId: 'session_2',
    );

    final entity = model.toEntity();

    expect(entity.status, GuestSessionStatus.revoked);
    expect(entity.ownership?.ownerUid, 'uid_new');
    expect(entity.ownership?.isMigrated, isTrue);
  });

  test('guestSessionModelFromEntity serializes ownership fields', () {
    final entity = GuestSessionEntity(
      sessionId: 'session_3',
      routeId: 'route_3',
      guestUid: 'guest_3',
      expiresAt: DateTime.utc(2026, 2, 20, 10),
      status: GuestSessionStatus.expired,
      createdAt: DateTime.utc(2026, 2, 18, 10),
      ownership: LocalOwnershipEntity(
        ownerUid: 'uid_x',
        previousOwnerUid: 'uid_y',
        migratedAt: DateTime.utc(2026, 2, 18, 10, 5),
      ),
    );

    final model = guestSessionModelFromEntity(entity);
    final map = model.toMap();

    expect(model.status, 'expired');
    expect(map['ownerUid'], 'uid_x');
    expect(map['previousOwnerUid'], 'uid_y');
    expect(map['migratedAt'], '2026-02-18T10:05:00.000Z');
  });
}
