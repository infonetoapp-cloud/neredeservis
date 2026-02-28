import 'package:flutter/material.dart';

void showRouterDriverBatteryOptimizationDegradeMaterialBanner({
  required ScaffoldMessengerState messenger,
  required Future<void> Function() onOpenSettingsTap,
  required VoidCallback onCloseTap,
}) {
  messenger.hideCurrentMaterialBanner();
  messenger.showMaterialBanner(
    MaterialBanner(
      content: const Text(
        'Pil optimizasyonu a??k kald??? i?in degrade izleme modu aktif. Arka planda konum ak??? kesilebilir.',
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () async {
            await onOpenSettingsTap();
          },
          child: const Text('Ayarlar\'dan Ac'),
        ),
        TextButton(
          onPressed: onCloseTap,
          child: const Text('Kapat'),
        ),
      ],
    ),
  );
}
