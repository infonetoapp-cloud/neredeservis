import 'package:flutter/widgets.dart';

class CoreSpacing {
  const CoreSpacing._();

  static const double grid = 4;

  static const double space4 = 4;
  static const double space8 = 8;
  static const double space10 = 10;
  static const double space12 = 12;
  static const double space16 = 16;
  static const double space18 = 18;
  static const double space20 = 20;
  static const double space24 = 24;
  static const double space32 = 32;
  static const double space40 = 40;
  static const double space48 = 48;

  static const EdgeInsets screenPadding = EdgeInsets.symmetric(
    horizontal: space20, // Uber uses generous horizontal paddings
    vertical: space24,
  );

  static const EdgeInsets cardPadding = EdgeInsets.all(space16);
  static const EdgeInsets pillPadding = EdgeInsets.symmetric(
    horizontal: space16,
    vertical: space8,
  );
}
