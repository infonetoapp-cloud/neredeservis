import 'package:flutter/widgets.dart';

class AmberElevationTokens {
  const AmberElevationTokens._();

  static const double level0 = 0;
  static const double level1 = 1;
  static const double level2 = 3;
  static const double level3 = 6;

  static const List<BoxShadow> shadowLevel1 = <BoxShadow>[
    BoxShadow(
      color: Color(0x14101413),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> shadowLevel2 = <BoxShadow>[
    BoxShadow(
      color: Color(0x1F101413),
      blurRadius: 14,
      offset: Offset(0, 6),
    ),
  ];
}
