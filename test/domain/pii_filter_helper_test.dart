import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/pii_filter_helper.dart';

void main() {
  test('redactText masks email, phone, srv code and idempotency key', () {
    const raw = 'mail: test@example.com phone: +90 532 123 45 67 '
        'srv: AB2CD3 idem: start_trip-route_1-abc123-ABCDEFGHJK';

    final redacted = PiiFilterHelper.redactText(raw);

    expect(redacted, contains('[EMAIL]'));
    expect(redacted, contains('[PHONE]'));
    expect(redacted, contains('[SRV_CODE]'));
    expect(redacted, contains('[IDEMPOTENCY_KEY]'));
    expect(redacted, isNot(contains('test@example.com')));
    expect(redacted, isNot(contains('AB2CD3')));
  });

  test('redactMap masks sensitive keys and nested values', () {
    final raw = <String, dynamic>{
      'uid': 'user-1',
      'message': 'call me at +90 532 111 22 33',
      'profile': <String, dynamic>{
        'email': 'driver@example.com',
        'note': 'srv AB2CD3',
      },
      'items': <dynamic>[
        'token=abcdef',
        <String, dynamic>{'phoneNumber': '+90 555 000 00 11'},
      ],
    };

    final redacted = PiiFilterHelper.redactMap(raw);

    expect(redacted['uid'], '[REDACTED]');
    expect(redacted['message'], contains('[PHONE]'));
    expect(
        (redacted['profile'] as Map<String, dynamic>)['email'], '[REDACTED]');
    expect((redacted['profile'] as Map<String, dynamic>)['note'],
        contains('[SRV_CODE]'));

    final items = redacted['items'] as List<dynamic>;
    expect(items.first, isA<String>());
    expect((items[1] as Map<String, dynamic>)['phoneNumber'], '[REDACTED]');
  });

  test('redactDynamic keeps non-PII primitives untouched', () {
    expect(PiiFilterHelper.redactDynamic(42), 42);
    expect(PiiFilterHelper.redactDynamic(true), isTrue);
    expect(PiiFilterHelper.redactDynamic(null), isNull);
  });
}
