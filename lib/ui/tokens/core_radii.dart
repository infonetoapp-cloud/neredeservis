import 'package:flutter/widgets.dart';

class CoreRadii {
  const CoreRadii._();

  // Primary radii definitions for a sharper, premium look.
  static const double radius8Value = 8;
  static const double radius12Value = 12;
  static const double radius16Value = 16;
  static const double radius24Value = 24; // Used sparingly for large modals

  static const BorderRadius radius8 = BorderRadius.all(
    Radius.circular(radius8Value),
  );
  static const BorderRadius radius12 = BorderRadius.all(
    Radius.circular(radius12Value),
  );
  static const BorderRadius radius16 = BorderRadius.all(
    Radius.circular(radius16Value),
  );
  static const BorderRadius radius24 = BorderRadius.all(
    Radius.circular(radius24Value),
  );

  // Legacy aliases → mapped for the sharper Uber style.
  static const double radius20Value = radius16Value;
  static const BorderRadius radius20 = radius16;
  static const double radius28Value = radius24Value;
  static const BorderRadius radius28 = radius24;
}
