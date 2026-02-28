import 'package:flutter/material.dart';

Future<void> showRouterDriverPendingSyncExitWarningDialog({
  required BuildContext context,
  required VoidCallback onReportIssueTap,
  required VoidCallback onExitWithoutWaitingTap,
}) {
  return showDialog<void>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: const Text('Senkronizasyon Bekleniyor'),
        content: const Text(
          'Veriler hen?z buluta g?nderilmedi. ??karsan?z i?lem arka planda tekrar denenecek.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Geri Don'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              onReportIssueTap();
            },
            child: const Text('Sorun Bildir'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              onExitWithoutWaitingTap();
            },
            child: const Text('Beklemeden Cik'),
          ),
        ],
      );
    },
  );
}
