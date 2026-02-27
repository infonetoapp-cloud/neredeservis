import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show Clipboard, ClipboardData;

Future<bool?> showRouterYesNoAlertDialog({
  required BuildContext context,
  required String title,
  required String message,
  required String cancelLabel,
  required String confirmLabel,
  bool barrierDismissible = true,
}) {
  return showDialog<bool>(
    context: context,
    barrierDismissible: barrierDismissible,
    builder: (dialogContext) {
      return AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(cancelLabel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(confirmLabel),
          ),
        ],
      );
    },
  );
}

Future<bool> showRouterSrvCodeDialog({
  required BuildContext context,
  required String srvCode,
}) async {
  final copied = await showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: const Text('Rota hazir'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Text(
              'Yolcularin katilabilmesi icin bu SRV kodunu paylas.',
            ),
            const SizedBox(height: 12),
            SelectableText(
              srvCode,
              style: Theme.of(dialogContext).textTheme.headlineSmall,
            ),
          ],
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: srvCode));
              if (!dialogContext.mounted) {
                return;
              }
              Navigator.of(dialogContext).pop(true);
            },
            child: const Text('Kopyala'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Tamam'),
          ),
        ],
      );
    },
  );

  return copied ?? false;
}
