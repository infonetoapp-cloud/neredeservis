import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/domain/entities/user_entity.dart';
import 'package:neredeservis/features/domain/mappers/user_mapper.dart';
import 'package:neredeservis/features/domain/models/user_model.dart';

void main() {
  test('UserModel.fromMap + toEntity maps api contract fields', () {
    final model = UserModel.fromMap(
      <String, dynamic>{
        'role': 'driver',
        'displayName': 'Sinan Y.',
        'phone': '+905551112233',
        'email': 'sinan@example.com',
        'createdAt': '2026-02-18T09:00:00.000Z',
        'updatedAt': '2026-02-18T09:30:00.000Z',
        'deletedAt': null,
      },
      uid: 'uid_001',
    );

    final entity = model.toEntity();

    expect(entity.uid, 'uid_001');
    expect(entity.role, UserRole.driver);
    expect(entity.displayName, 'Sinan Y.');
    expect(entity.phone, '+905551112233');
    expect(entity.email, 'sinan@example.com');
    expect(entity.createdAt.isUtc, isTrue);
    expect(entity.updatedAt.isUtc, isTrue);
    expect(entity.deletedAt, isNull);
    expect(entity.isDeleted, isFalse);
  });

  test('toEntity falls back role to unknown on unsupported role value', () {
    const model = UserModel(
      uid: 'uid_002',
      role: 'admin',
      displayName: 'Unknown Role',
      phone: null,
      email: null,
      createdAt: '2026-02-18T10:00:00.000Z',
      updatedAt: '2026-02-18T10:00:00.000Z',
      deletedAt: null,
    );

    final entity = model.toEntity();

    expect(entity.role, UserRole.unknown);
  });

  test('userModelFromEntity creates serializable model contract', () {
    final entity = UserEntity(
      uid: 'uid_003',
      role: UserRole.passenger,
      displayName: 'Passenger User',
      phone: null,
      email: 'passenger@example.com',
      createdAt: DateTime.utc(2026, 2, 18, 11, 0, 0),
      updatedAt: DateTime.utc(2026, 2, 18, 11, 45, 0),
      deletedAt: DateTime.utc(2026, 2, 19, 0, 0, 0),
    );

    final model = userModelFromEntity(entity);

    expect(model.uid, 'uid_003');
    expect(model.role, 'passenger');
    expect(model.displayName, 'Passenger User');
    expect(model.phone, isNull);
    expect(model.email, 'passenger@example.com');
    expect(model.createdAt, '2026-02-18T11:00:00.000Z');
    expect(model.updatedAt, '2026-02-18T11:45:00.000Z');
    expect(model.deletedAt, '2026-02-19T00:00:00.000Z');

    final map = model.toMap();
    expect(map['role'], 'passenger');
    expect(map['displayName'], 'Passenger User');
    expect(map['deletedAt'], '2026-02-19T00:00:00.000Z');
  });
}
