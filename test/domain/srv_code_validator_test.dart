import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/srv_code_validator.dart';

void main() {
  test('isValid accepts uppercase 6-char alphabet', () {
    expect(SrvCodeValidator.isValid('AB2CD3'), isTrue);
    expect(SrvCodeValidator.isValid('ZYXWVU'), isTrue);
  });

  test('isValid rejects ambiguous chars and malformed length', () {
    expect(SrvCodeValidator.isValid('AB1CD3'), isFalse);
    expect(SrvCodeValidator.isValid('AB0CD3'), isFalse);
    expect(SrvCodeValidator.isValid('ABICD3'), isFalse);
    expect(SrvCodeValidator.isValid('ABOCD3'), isFalse);
    expect(SrvCodeValidator.isValid('ABC'), isFalse);
    expect(SrvCodeValidator.isValid('AB2CD34'), isFalse);
  });

  test('normalize uppercases and trims input', () {
    expect(SrvCodeValidator.normalize('  ab2cd3  '), 'AB2CD3');
  });

  test('isNormalizedAndValid enforces normalized form', () {
    expect(SrvCodeValidator.isNormalizedAndValid('AB2CD3'), isTrue);
    expect(SrvCodeValidator.isNormalizedAndValid('ab2cd3'), isFalse);
  });

  test('assertValid throws for invalid codes', () {
    expect(() => SrvCodeValidator.assertValid('AB2CD3'), returnsNormally);
    expect(
      () => SrvCodeValidator.assertValid('AB1CD3'),
      throwsA(isA<FormatException>()),
    );
  });
}
