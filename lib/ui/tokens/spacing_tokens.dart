import 'package:flutter/widgets.dart';

class AmberSpacingTokens {
  const AmberSpacingTokens._();

  static const double grid = 4;

  static const double space8 = 8;
  static const double space12 = 12;
  static const double space16 = 16;
  static const double space20 = 20;
  static const double space24 = 24;
  static const double space32 = 32;

  static const EdgeInsets screenPadding = EdgeInsets.symmetric(
    horizontal: space16,
    vertical: space20,
  );

  static const EdgeInsets cardPadding = EdgeInsets.all(space16);
  static const EdgeInsets pillPadding = EdgeInsets.symmetric(
    horizontal: space12,
    vertical: space8,
  );
}
