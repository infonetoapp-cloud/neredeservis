import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/phone_masking_helper.dart';

void main() {
  test('mask preserves separators and masks middle digits', () {
    final masked = PhoneMaskingHelper.mask('+90 532 123 45 67');
    expect(masked, '+90 5** *** ** 67');
  });

  test('mask works with plain digit strings', () {
    final masked = PhoneMaskingHelper.mask('05321234567');
    expect(masked, '053******67');
  });

  test('mask applies safe fallback for short numbers', () {
    final masked = PhoneMaskingHelper.mask('1234');
    expect(masked, '1**4');
  });

  test('mask returns empty for null or blank input', () {
    expect(PhoneMaskingHelper.mask(null), '');
    expect(PhoneMaskingHelper.mask('   '), '');
  });
}
