import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class AndroidLocationBackgroundService {
  AndroidLocationBackgroundService({
    MethodChannel? channel,
    bool Function()? isAndroidOverride,
  })  : _channel = channel ?? const MethodChannel(_channelName),
        _isAndroid = isAndroidOverride ??
            (() => !kIsWeb && defaultTargetPlatform == TargetPlatform.android);

  static const String _channelName = 'neredeservis/background_location_service';
  static const String _startMethod = 'startDriverLocationService';
  static const String _stopMethod = 'stopDriverLocationService';
  static const String _isRunningMethod = 'isDriverLocationServiceRunning';

  final MethodChannel _channel;
  final bool Function() _isAndroid;

  Future<bool> startDriverLocationService() async {
    if (!_isAndroid()) {
      return false;
    }
    try {
      final started = await _channel.invokeMethod<bool>(_startMethod);
      return started == true;
    } on PlatformException {
      return false;
    }
  }

  Future<bool> stopDriverLocationService() async {
    if (!_isAndroid()) {
      return false;
    }
    try {
      final stopped = await _channel.invokeMethod<bool>(_stopMethod);
      return stopped == true;
    } on PlatformException {
      return false;
    }
  }

  Future<bool> isDriverLocationServiceRunning() async {
    if (!_isAndroid()) {
      return false;
    }
    try {
      final running = await _channel.invokeMethod<bool>(_isRunningMethod);
      return running == true;
    } on PlatformException {
      return false;
    }
  }
}
