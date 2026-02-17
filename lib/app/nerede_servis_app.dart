import 'package:flutter/material.dart';

import '../config/app_flavor.dart';

class NeredeServisApp extends StatelessWidget {
  const NeredeServisApp({
    super.key,
    required this.flavorConfig,
  });

  final AppFlavorConfig flavorConfig;

  @override
  Widget build(BuildContext context) {
    final theme = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFFB86A00),
        brightness: Brightness.light,
      ),
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: flavorConfig.appName,
      theme: theme,
      home: Scaffold(
        appBar: AppBar(
          title: Text(flavorConfig.appName),
        ),
        body: Center(
          child: Text(
            'Firebase init ok (${flavorConfig.flavor.name})',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      ),
    );
  }
}
