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
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: flavorConfig.appName,
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
