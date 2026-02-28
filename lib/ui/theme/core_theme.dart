import 'package:flutter/material.dart';

import 'theme_builder.dart';

class CoreTheme {
  const CoreTheme._();

  static ThemeData light() {
    return CoreThemeBuilder.buildLightTheme();
  }
}
