import 'package:flutter/widgets.dart';

class CoreElevations {
  const CoreElevations._();

  static const double level0 = 0;
  static const double level1 = 2;
  static const double level2 = 4;
  static const double level3 = 8;

  static const List<BoxShadow> shadowLevel1 = <BoxShadow>[
    BoxShadow(
      color: Color(0x0A000000), // Very subtile black shadow
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> shadowLevel2 = <BoxShadow>[
    BoxShadow(
      color: Color(0x14000000), // Slightly deeper
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> shadowLevel3 = <BoxShadow>[
    BoxShadow(
      color: Color(0x1A000000), // Deep modal shadow
      blurRadius: 24,
      offset: Offset(0, 8),
    ),
  ];
}
