import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/application/driver_heartbeat_voice_feedback_service.dart';

void main() {
  group('DriverHeartbeatVoiceFeedbackService', () {
    test('announces expected Turkish phrases per event', () async {
      final fakeEngine = _FakeDriverVoiceEngine();
      var nowUtc = DateTime.utc(2026, 2, 19, 0, 0, 0);
      final service = DriverHeartbeatVoiceFeedbackService(
        engine: fakeEngine,
        nowUtc: () => nowUtc,
      );

      await service.announce(DriverHeartbeatVoiceEvent.connectionLost);
      nowUtc = nowUtc.add(const Duration(seconds: 3));
      await service.announce(DriverHeartbeatVoiceEvent.connected);
      nowUtc = nowUtc.add(const Duration(seconds: 3));
      await service.announce(DriverHeartbeatVoiceEvent.tripEnded);

      expect(
        fakeEngine.spokenMessages,
        <String>[
          'Baglanti kesildi',
          'Baglandim',
          'Sefer sonlandirildi',
        ],
      );
      expect(fakeEngine.configureCount, 1);
      expect(fakeEngine.stopCount, 3);
    });

    test('deduplicates same message inside dedupe window', () async {
      final fakeEngine = _FakeDriverVoiceEngine();
      var nowUtc = DateTime.utc(2026, 2, 19, 10, 0, 0);
      final service = DriverHeartbeatVoiceFeedbackService(
        engine: fakeEngine,
        nowUtc: () => nowUtc,
      );

      await service.announce(DriverHeartbeatVoiceEvent.connectionLost);
      nowUtc = nowUtc.add(const Duration(seconds: 1));
      await service.announce(DriverHeartbeatVoiceEvent.connectionLost);
      nowUtc = nowUtc.add(const Duration(seconds: 2));
      await service.announce(DriverHeartbeatVoiceEvent.connectionLost);

      expect(
        fakeEngine.spokenMessages,
        <String>['Baglanti kesildi', 'Baglanti kesildi'],
      );
      expect(fakeEngine.stopCount, 2);
    });

    test('disabled mode suppresses all voice feedback', () async {
      final fakeEngine = _FakeDriverVoiceEngine();
      final service = DriverHeartbeatVoiceFeedbackService(
        engine: fakeEngine,
        isEnabled: () async => false,
      );

      await service.announce(DriverHeartbeatVoiceEvent.connectionLost);
      await service.announce(DriverHeartbeatVoiceEvent.connected);
      await service.announce(DriverHeartbeatVoiceEvent.tripEnded);

      expect(fakeEngine.configureCount, 0);
      expect(fakeEngine.stopCount, 0);
      expect(fakeEngine.spokenMessages, isEmpty);
    });
  });
}

class _FakeDriverVoiceEngine implements DriverVoiceEngine {
  int configureCount = 0;
  int stopCount = 0;
  final List<String> spokenMessages = <String>[];

  @override
  Future<void> configure() async {
    configureCount += 1;
  }

  @override
  Future<void> speak(String message) async {
    spokenMessages.add(message);
  }

  @override
  Future<void> stop() async {
    stopCount += 1;
  }
}
