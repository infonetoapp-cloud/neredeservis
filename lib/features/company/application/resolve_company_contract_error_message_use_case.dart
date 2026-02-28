class ResolveCompanyContractErrorMessageUseCase {
  const ResolveCompanyContractErrorMessageUseCase();

  String execute({
    String? errorCode,
    String? errorMessage,
    Object? errorDetails,
  }) {
    final reason = _resolveReasonCode(
      errorCode: errorCode,
      errorMessage: errorMessage,
      errorDetails: errorDetails,
    );
    switch (reason) {
      case 'OWNER_MEMBER_IMMUTABLE':
        return 'Owner uye degistirilemez.';
      case 'SELF_MEMBER_REMOVE_FORBIDDEN':
        return 'Kendi hesabini sirketten cikaramazsin.';
      case 'INVITE_EMAIL_NOT_FOUND':
        return 'Bu e-posta ile kayitli kullanici bulunamadi.';
      case 'INVITE_NOT_ACCEPTABLE':
        return 'Bu davet artik kabul edilemez.';
      case 'INVITE_NOT_DECLINABLE':
        return 'Bu davet artik reddedilemez.';
      case 'ROUTE_PRIMARY_DRIVER_IMMUTABLE':
        return 'Ana surucunun route yetkisi sifirlanamaz.';
      case 'UPGRADE_REQUIRED':
      case 'FORCE_UPDATE_REQUIRED':
        return 'Uygulamayi guncellemeden bu islem yapilamaz.';
      default:
        return 'Islem tamamlanamadi. Lutfen tekrar dene.';
    }
  }

  String? _resolveReasonCode({
    String? errorCode,
    String? errorMessage,
    Object? errorDetails,
  }) {
    final normalizedCode = (errorCode ?? '').trim().toUpperCase();
    final normalizedMessage = (errorMessage ?? '').trim().toUpperCase();

    if (errorDetails is Map<Object?, Object?>) {
      final detailsMap = Map<String, dynamic>.from(errorDetails);
      final direct = detailsMap['reasonCode'] ?? detailsMap['reason'];
      if (direct is String && direct.trim().isNotEmpty) {
        return direct.trim().toUpperCase();
      }
    }

    const knownReasonCodes = <String>[
      'OWNER_MEMBER_IMMUTABLE',
      'SELF_MEMBER_REMOVE_FORBIDDEN',
      'INVITE_EMAIL_NOT_FOUND',
      'INVITE_NOT_ACCEPTABLE',
      'INVITE_NOT_DECLINABLE',
      'ROUTE_PRIMARY_DRIVER_IMMUTABLE',
      'UPGRADE_REQUIRED',
      'FORCE_UPDATE_REQUIRED',
    ];

    for (final reasonCode in knownReasonCodes) {
      if (normalizedCode == reasonCode ||
          normalizedMessage.contains(reasonCode)) {
        return reasonCode;
      }
    }
    return null;
  }
}
