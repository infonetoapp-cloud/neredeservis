import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/active_trip_screen.dart';

void main() {
  test('buildDriverLockedGesturesSettings disables driving-time gestures', () {
    final settings = buildDriverLockedGesturesSettings();

    expect(settings.rotateEnabled, isFalse);
    expect(settings.pinchToZoomEnabled, isFalse);
    expect(settings.scrollEnabled, isFalse);
    expect(settings.pitchEnabled, isFalse);
    expect(settings.doubleTapToZoomInEnabled, isFalse);
    expect(settings.doubleTouchToZoomOutEnabled, isFalse);
    expect(settings.quickZoomEnabled, isFalse);
    expect(settings.pinchPanEnabled, isFalse);
  });
}
