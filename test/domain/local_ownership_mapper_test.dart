import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/local_ownership_entity.dart';
import 'package:neredeservis/features/domain/mappers/local_ownership_mapper.dart';
import 'package:neredeservis/features/domain/models/local_ownership_model.dart';

void main() {
  test('LocalOwnershipModel.fromMap + toEntity maps migration fields', () {
    final model = LocalOwnershipModel.fromMap(
      <String, dynamic>{
        'ownerUid': 'uid_new',
        'previousOwnerUid': 'uid_old',
        'migratedAt': '2026-02-18T10:00:00.000Z',
      },
    );

    final entity = model.toEntity();

    expect(entity.ownerUid, 'uid_new');
    expect(entity.previousOwnerUid, 'uid_old');
    expect(entity.migratedAt?.isUtc, isTrue);
    expect(entity.isMigrated, isTrue);
  });

  test('localOwnershipModelFromEntity serializes nullable fields', () {
    const entity = LocalOwnershipEntity(
      ownerUid: 'uid_single',
      previousOwnerUid: null,
      migratedAt: null,
    );

    final model = localOwnershipModelFromEntity(entity);
    final map = model.toMap();

    expect(map['ownerUid'], 'uid_single');
    expect(map['previousOwnerUid'], isNull);
    expect(map['migratedAt'], isNull);
  });
}
