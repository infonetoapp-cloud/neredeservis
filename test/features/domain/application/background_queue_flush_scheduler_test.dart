import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/application/background_queue_flush_scheduler.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('BackgroundQueueFlushScheduler', () {
    test('initializes and schedules periodic task on Android', () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final runtime = _FakeBackgroundWorkRuntime();
      final scheduler = BackgroundQueueFlushScheduler(
        backgroundWorkRuntime: runtime,
        platformResolver: () => BackgroundQueueFlushPlatform.android,
      );

      final scheduled =
          await scheduler.configureForOwner(ownerUid: ' driver-1 ');

      expect(scheduled, isTrue);
      expect(runtime.initializeCalls, 1);
      expect(runtime.periodicRequests.length, 1);
      expect(
        runtime.periodicRequests.single.uniqueName,
        BackgroundQueueFlushScheduler.androidPeriodicUniqueName,
      );
      expect(
        runtime.periodicRequests.single.inputData,
        <String, dynamic>{
          BackgroundQueueFlushScheduler.ownerUidInputKey: 'driver-1',
        },
      );
      expect(await scheduler.readStoredOwnerUid(), 'driver-1');
    });

    test('schedules iOS periodic background task', () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final runtime = _FakeBackgroundWorkRuntime();
      final scheduler = BackgroundQueueFlushScheduler(
        backgroundWorkRuntime: runtime,
        platformResolver: () => BackgroundQueueFlushPlatform.ios,
      );

      final scheduled = await scheduler.configureForOwner(ownerUid: 'driver-2');

      expect(scheduled, isTrue);
      expect(runtime.initializeCalls, 1);
      expect(runtime.periodicRequests.length, 1);
      expect(
        runtime.periodicRequests.single.uniqueName,
        BackgroundQueueFlushScheduler.iosPeriodicTaskIdentifier,
      );
      expect(
        runtime.periodicRequests.single.inputData,
        <String, dynamic>{
          BackgroundQueueFlushScheduler.ownerUidInputKey: 'driver-2',
        },
      );
    });

    test('disable clears owner and cancels known tasks', () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final runtime = _FakeBackgroundWorkRuntime();
      final scheduler = BackgroundQueueFlushScheduler(
        backgroundWorkRuntime: runtime,
        platformResolver: () => BackgroundQueueFlushPlatform.android,
      );

      await scheduler.configureForOwner(ownerUid: 'driver-3');
      await scheduler.disable();

      expect(await scheduler.readStoredOwnerUid(), isNull);
      expect(
        runtime.cancelledUniqueNames,
        contains(BackgroundQueueFlushScheduler.androidPeriodicUniqueName),
      );
      expect(
        runtime.cancelledUniqueNames,
        contains(BackgroundQueueFlushScheduler.iosPeriodicTaskIdentifier),
      );
    });
  });
}

class _FakeBackgroundWorkRuntime implements BackgroundWorkRuntime {
  int initializeCalls = 0;
  final List<_TaskRequest> periodicRequests = <_TaskRequest>[];
  final List<String> cancelledUniqueNames = <String>[];

  @override
  Future<void> initialize(
    Function callbackDispatcher, {
    bool isInDebugMode = false,
  }) async {
    initializeCalls++;
  }

  @override
  Future<void> registerPeriodicTask({
    required String uniqueName,
    required String taskName,
    required Duration frequency,
    required Map<String, dynamic> inputData,
  }) async {
    periodicRequests.add(
      _TaskRequest(
        uniqueName: uniqueName,
        taskName: taskName,
        inputData: Map<String, dynamic>.from(inputData),
      ),
    );
  }

  @override
  Future<void> cancelByUniqueName(String uniqueName) async {
    cancelledUniqueNames.add(uniqueName);
  }
}

class _TaskRequest {
  const _TaskRequest({
    required this.uniqueName,
    required this.taskName,
    required this.inputData,
  });

  final String uniqueName;
  final String taskName;
  final Map<String, dynamic> inputData;
}
