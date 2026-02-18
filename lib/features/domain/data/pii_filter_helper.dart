import '../../../core/security/pii_redactor.dart';

class PiiFilterHelper {
  const PiiFilterHelper._();

  static String redactText(String input) {
    return PiiRedactor.redactText(input);
  }

  static Map<String, dynamic> redactMap(Map<String, dynamic> source) {
    return PiiRedactor.redactMap(source);
  }

  static dynamic redactDynamic(dynamic value) {
    return PiiRedactor.redactDynamic(value);
  }
}
