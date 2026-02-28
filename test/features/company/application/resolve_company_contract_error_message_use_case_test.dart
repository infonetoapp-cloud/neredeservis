import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/company/application/resolve_company_contract_error_message_use_case.dart';

void main() {
  group('ResolveCompanyContractErrorMessageUseCase', () {
    const useCase = ResolveCompanyContractErrorMessageUseCase();

    test('details reasonCode ustunden owner immutable map eder', () {
      final message = useCase.execute(
        errorDetails: <String, dynamic>{'reasonCode': 'OWNER_MEMBER_IMMUTABLE'},
      );

      expect(message, 'Owner uye degistirilemez.');
    });

    test('error message icinden invite not acceptable map eder', () {
      final message = useCase.execute(
        errorMessage: 'failed-precondition: INVITE_NOT_ACCEPTABLE',
      );

      expect(message, 'Bu davet artik kabul edilemez.');
    });

    test('upgrade required icin guncelle copy dondurur', () {
      final message = useCase.execute(errorCode: 'UPGRADE_REQUIRED');

      expect(message, 'Uygulamayi guncellemeden bu islem yapilamaz.');
    });

    test('bilinmeyen durumda fallback copy dondurur', () {
      final message = useCase.execute(errorCode: 'unknown');

      expect(message, 'Islem tamamlanamadi. Lutfen tekrar dene.');
    });
  });
}
