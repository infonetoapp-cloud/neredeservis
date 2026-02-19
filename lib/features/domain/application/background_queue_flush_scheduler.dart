import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';

import '../../location/application/location_publish_service.dart';
import '../data/local_drift_database.dart';
import '../data/local_queue_repository.dart';
import '../data/rtdb_domain_repositories.dart';
import 'queue_flush_orchestrator.dart';
import 'trip_action_sync_service.dart';

enum BackgroundQueueFlushPlatform {
  android,
  ios,
  unsupported,
}

typedef SharedPreferencesLoader = Future<SharedPreferences> Function();
typedef BackgroundQueueFlushPlatformResolver = BackgroundQueueFlushPlatform
    Function();

abstract class BackgroundWorkRuntime {
  Future<void> initialize(
    Function callbackDispatcher, {
    bool isInDebugMode,
  });

  Future<void> registerPeriodicTask({
    required String uniqueName,
    required String taskName,
    required Duration frequency,
    required Map<String, dynamic> inputData,
  });

  Future<void> cancelByUniqueName(String uniqueName);
}

class WorkmanagerBackgroundWorkRuntime implements BackgroundWorkRuntime {
  @override
  Future<void> initialize(
    Function callbackDispatcher, {
    bool isInDebugMode = false,
  }) {
    return Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: isInDebugMode,
    );
  }

  @override
  Future<void> registerPeriodicTask({
    required String uniqueName,
    required String taskName,
    required Duration frequency,
    required Map<String, dynamic> inputData,
  }) {
    return Workmanager().registerPeriodicTask(
      uniqueName,
      taskName,
      frequency: frequency,
      existingWorkPolicy: ExistingWorkPolicy.replace,
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
      inputData: inputData,
    );
  }

  @override
  Future<void> cancelByUniqueName(String uniqueName) {
    return Workmanager().cancelByUniqueName(uniqueName);
  }
}

class BackgroundQueueFlushScheduler {
  BackgroundQueueFlushScheduler({
    BackgroundWorkRuntime? backgroundWorkRuntime,
    SharedPreferencesLoader? sharedPreferencesLoader,
    BackgroundQueueFlushPlatformResolver? platformResolver,
  })  : _backgroundWorkRuntime =
            backgroundWorkRuntime ?? WorkmanagerBackgroundWorkRuntime(),
        _sharedPreferencesLoader =
            sharedPreferencesLoader ?? SharedPreferences.getInstance,
        _platformResolver =
            platformResolver ?? _defaultBackgroundQueueFlushPlatformResolver;

  static const Duration periodicFrequency = Duration(minutes: 15);

  static const String ownerUidInputKey = 'ownerUid';
  static const String ownerUidPrefsKey = 'background.queue_flush.owner_uid';

  static const String androidPeriodicUniqueName =
      'neredeservis.queue.flush.periodic';
  static const String androidPeriodicTaskName =
      'neredeservis_queue_flush_periodic';

  // Must stay aligned with ios/Runner/AppDelegate.swift + Info.plist.
  static const String iosPeriodicTaskIdentifier =
      'com.neredeservis.driver.queue.flush';

  final BackgroundWorkRuntime _backgroundWorkRuntime;
  final SharedPreferencesLoader _sharedPreferencesLoader;
  final BackgroundQueueFlushPlatformResolver _platformResolver;

  bool _initialized = false;

  Future<bool> ensureInitialized() async {
    final platform = _platformResolver();
    if (platform == BackgroundQueueFlushPlatform.unsupported) {
      return false;
    }
    if (_initialized) {
      return true;
    }
    try {
      await _backgroundWorkRuntime.initialize(
        backgroundQueueFlushCallbackDispatcher,
      );
      _initialized = true;
      return true;
    } catch (error) {
      debugPrint('Background queue flush init failed: $error');
      return false;
    }
  }

  Future<bool> configureForOwner({
    required String ownerUid,
  }) async {
    final normalizedOwnerUid = _normalizeOwnerUid(ownerUid);
    if (normalizedOwnerUid == null) {
      await disable();
      return false;
    }
    final platform = _platformResolver();
    if (platform == BackgroundQueueFlushPlatform.unsupported) {
      return false;
    }
    final initialized = await ensureInitialized();
    if (!initialized) {
      return false;
    }

    final preferences = await _sharedPreferencesLoader();
    await preferences.setString(ownerUidPrefsKey, normalizedOwnerUid);

    final inputData = <String, dynamic>{
      ownerUidInputKey: normalizedOwnerUid,
    };

    try {
      switch (platform) {
        case BackgroundQueueFlushPlatform.android:
          await _backgroundWorkRuntime.registerPeriodicTask(
            uniqueName: androidPeriodicUniqueName,
            taskName: androidPeriodicTaskName,
            frequency: periodicFrequency,
            inputData: inputData,
          );
          return true;
        case BackgroundQueueFlushPlatform.ios:
          await _backgroundWorkRuntime.registerPeriodicTask(
            uniqueName: iosPeriodicTaskIdentifier,
            taskName: iosPeriodicTaskIdentifier,
            frequency: periodicFrequency,
            inputData: inputData,
          );
          return true;
        case BackgroundQueueFlushPlatform.unsupported:
          return false;
      }
    } catch (error) {
      debugPrint('Background queue flush schedule failed: $error');
      return false;
    }
  }

  Future<void> disable() async {
    final preferences = await _sharedPreferencesLoader();
    await preferences.remove(ownerUidPrefsKey);

    try {
      await _backgroundWorkRuntime.cancelByUniqueName(
        androidPeriodicUniqueName,
      );
    } catch (_) {
      // Best-effort cleanup.
    }
    try {
      await _backgroundWorkRuntime.cancelByUniqueName(
        iosPeriodicTaskIdentifier,
      );
    } catch (_) {
      // Best-effort cleanup.
    }
  }

  Future<String?> readStoredOwnerUid() async {
    final preferences = await _sharedPreferencesLoader();
    return _normalizeOwnerUid(preferences.getString(ownerUidPrefsKey));
  }
}

@pragma('vm:entry-point')
void backgroundQueueFlushCallbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    final ownerUid = await _resolveOwnerUidForBackgroundRun(inputData);
    if (ownerUid == null) {
      return true;
    }

    try {
      await _ensureFirebaseInitializedForBackgroundRun();
      await _flushQueueInBackground(ownerUid: ownerUid);
      return true;
    } catch (error, stackTrace) {
      debugPrint('Background queue flush task failed: $error');
      debugPrintStack(stackTrace: stackTrace);
      return false;
    }
  });
}

Future<String?> _resolveOwnerUidForBackgroundRun(
  Map<String, dynamic>? inputData,
) async {
  final rawFromInput =
      inputData?[BackgroundQueueFlushScheduler.ownerUidInputKey];
  final fromInput =
      _normalizeOwnerUid(rawFromInput is String ? rawFromInput : null);
  if (fromInput != null) {
    return fromInput;
  }
  final preferences = await SharedPreferences.getInstance();
  return _normalizeOwnerUid(
    preferences.getString(BackgroundQueueFlushScheduler.ownerUidPrefsKey),
  );
}

Future<void> _ensureFirebaseInitializedForBackgroundRun() async {
  if (Firebase.apps.isNotEmpty) {
    return;
  }
  await Firebase.initializeApp();
}

Future<void> _flushQueueInBackground({
  required String ownerUid,
}) async {
  final database = LocalDriftDatabase();
  try {
    final localQueueRepository = LocalQueueRepository(database: database);
    final locationPublishService = LocationPublishService(
      liveLocationRepository: RtdbLiveLocationRepository(),
      localQueueRepository: localQueueRepository,
    );
    final tripActionSyncService = TripActionSyncService(
      localQueueRepository: localQueueRepository,
    );
    final orchestrator = QueueFlushOrchestrator(
      localQueueRepository: localQueueRepository,
      tripActionSyncService: tripActionSyncService,
      locationPublishService: locationPublishService,
    );

    final hasPending = await orchestrator.hasPendingQueue(ownerUid: ownerUid);
    if (!hasPending) {
      return;
    }
    await orchestrator.flushAll(ownerUid: ownerUid);
  } finally {
    await database.close();
  }
}

String? _normalizeOwnerUid(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}

BackgroundQueueFlushPlatform _defaultBackgroundQueueFlushPlatformResolver() {
  if (kIsWeb) {
    return BackgroundQueueFlushPlatform.unsupported;
  }
  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
      return BackgroundQueueFlushPlatform.android;
    case TargetPlatform.iOS:
      return BackgroundQueueFlushPlatform.ios;
    default:
      return BackgroundQueueFlushPlatform.unsupported;
  }
}
