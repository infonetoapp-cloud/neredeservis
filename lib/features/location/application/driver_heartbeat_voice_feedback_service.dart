import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';

enum DriverHeartbeatVoiceEvent {
  connectionLost,
  connected,
  tripEnded,
}

abstract class DriverVoiceEngine {
  Future<void> configure();
  Future<void> speak(String message);
  Future<void> stop();
}

class FlutterTtsDriverVoiceEngine implements DriverVoiceEngine {
  FlutterTtsDriverVoiceEngine({FlutterTts? tts}) : _tts = tts ?? FlutterTts();

  final FlutterTts _tts;
  bool _configured = false;

  @override
  Future<void> configure() async {
    if (_configured) {
      return;
    }
    try {
      await _tts.setLanguage('tr-TR');
      await _tts.setSpeechRate(0.46);
      await _tts.setVolume(1.0);
      await _tts.setPitch(1.0);
      await _tts.awaitSpeakCompletion(false);
    } on MissingPluginException {
      // Platform channel may be unavailable in widget/unit tests.
    } on PlatformException {
      // TTS engine may be missing or inaccessible on some devices.
    }
    _configured = true;
  }

  @override
  Future<void> speak(String message) async {
    try {
      await _tts.speak(message);
    } on MissingPluginException {
      // Platform channel may be unavailable in widget/unit tests.
    } on PlatformException {
      // TTS engine may be missing or inaccessible on some devices.
    }
  }

  @override
  Future<void> stop() async {
    try {
      await _tts.stop();
    } on MissingPluginException {
      // Platform channel may be unavailable in widget/unit tests.
    } on PlatformException {
      // TTS engine may be missing or inaccessible on some devices.
    }
  }
}

class DriverHeartbeatVoiceFeedbackService {
  DriverHeartbeatVoiceFeedbackService({
    DriverVoiceEngine? engine,
    DateTime Function()? nowUtc,
    Future<bool> Function()? isEnabled,
    bool defaultEnabled = true,
    this.dedupeWindow = const Duration(seconds: 2),
  })  : _engine = engine ?? FlutterTtsDriverVoiceEngine(),
        _nowUtc = nowUtc ?? (() => DateTime.now().toUtc()),
        _isEnabled = isEnabled ?? (() async => defaultEnabled);

  final DriverVoiceEngine _engine;
  final DateTime Function() _nowUtc;
  final Future<bool> Function() _isEnabled;
  final Duration dedupeWindow;

  String? _lastMessage;
  DateTime? _lastSpokenAtUtc;
  bool _isConfigured = false;

  Future<void> announce(DriverHeartbeatVoiceEvent event) async {
    if (!await _isEnabled()) {
      return;
    }

    final message = _messageFor(event);
    final now = _nowUtc();
    final lastSpokenAtUtc = _lastSpokenAtUtc;
    if (_lastMessage == message &&
        lastSpokenAtUtc != null &&
        now.difference(lastSpokenAtUtc) < dedupeWindow) {
      return;
    }

    if (!_isConfigured) {
      await _engine.configure();
      _isConfigured = true;
    }

    await _engine.stop();
    await _engine.speak(message);
    _lastMessage = message;
    _lastSpokenAtUtc = now;
  }

  Future<void> dispose() async {
    await _engine.stop();
  }

  String _messageFor(DriverHeartbeatVoiceEvent event) {
    return switch (event) {
      DriverHeartbeatVoiceEvent.connectionLost => 'Baglanti kesildi',
      DriverHeartbeatVoiceEvent.connected => 'Baglandim',
      DriverHeartbeatVoiceEvent.tripEnded => 'Sefer sonlandirildi',
    };
  }
}
