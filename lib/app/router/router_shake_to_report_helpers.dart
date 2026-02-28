import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:sensors_plus/sensors_plus.dart';

import '../../features/support/application/shake_to_report_detector.dart';

typedef RouterAccelerometerStreamFactory = Stream<AccelerometerEvent>
    Function();

bool isRouterShakeToReportSupportedPlatform({
  required bool isWeb,
  required TargetPlatform platform,
}) {
  if (isWeb) {
    return false;
  }
  switch (platform) {
    case TargetPlatform.android:
    case TargetPlatform.iOS:
      return true;
    case TargetPlatform.fuchsia:
    case TargetPlatform.linux:
    case TargetPlatform.macOS:
    case TargetPlatform.windows:
      return false;
  }
}

StreamSubscription<AccelerometerEvent> startRouterShakeToReportListener({
  required ShakeToReportDetector detector,
  void Function(Object error)? onError,
  RouterAccelerometerStreamFactory accelerometerStreamFactory =
      accelerometerEventStream,
}) {
  return accelerometerStreamFactory().listen(
    (event) {
      detector.addSample(
        x: event.x,
        y: event.y,
        z: event.z,
      );
    },
    onError: onError,
  );
}
