import BackgroundTasks
import CoreMotion
import Flutter
import GoogleMaps
import UIKit
import workmanager

@main
@objc class AppDelegate: FlutterAppDelegate {
  private let watchdogChannelName = "neredeservis/ios_background_watchdog"
  private let watchdogTaskIdentifier = "com.neredeservis.driver.watchdog"
  private let queueFlushTaskIdentifier = "com.neredeservis.driver.queue.flush"

  private let watchdogEnabledKey = "ios_watchdog.enabled"
  private let watchdogTripIdKey = "ios_watchdog.trip_id"
  private let watchdogLastHeartbeatMsKey = "ios_watchdog.last_heartbeat_ms"
  private let watchdogLastWakeMsKey = "ios_watchdog.last_wake_ms"
  private let watchdogLastMovingSignalKey = "ios_watchdog.last_moving_signal"
  private let motionActivityManager = CMMotionActivityManager()
  private let motionActivityQueue = OperationQueue()

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if let mapsApiKey = Bundle.main.object(forInfoDictionaryKey: "GMSApiKey") as? String {
      let normalizedApiKey = mapsApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
      if !normalizedApiKey.isEmpty && !normalizedApiKey.contains("$(") {
        GMSServices.provideAPIKey(normalizedApiKey)
      }
    }

    GeneratedPluginRegistrant.register(with: self)
    WorkmanagerPlugin.setPluginRegistrantCallback { registry in
      GeneratedPluginRegistrant.register(with: registry)
    }
    WorkmanagerPlugin.registerPeriodicTask(
      withIdentifier: queueFlushTaskIdentifier,
      frequency: NSNumber(value: 15 * 60)
    )
    UIApplication.shared.setMinimumBackgroundFetchInterval(15 * 60)

    if #available(iOS 13.0, *) {
      registerBackgroundWatchdogTask()
    }
    if UserDefaults.standard.bool(forKey: watchdogEnabledKey) {
      startActivityRecognitionUpdates()
      _ = scheduleBackgroundWatchdog()
    }

    if let controller = window?.rootViewController as? FlutterViewController {
      let channel = FlutterMethodChannel(
        name: watchdogChannelName,
        binaryMessenger: controller.binaryMessenger
      )
      channel.setMethodCallHandler { [weak self] call, result in
        self?.handleWatchdogMethodCall(call, result: result)
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func applicationDidEnterBackground(_ application: UIApplication) {
    super.applicationDidEnterBackground(application)
    _ = scheduleBackgroundWatchdog()
  }

  private func handleWatchdogMethodCall(
    _ call: FlutterMethodCall,
    result: @escaping FlutterResult
  ) {
    switch call.method {
    case "registerWatchdog":
      guard let arguments = call.arguments as? [String: Any],
        let tripId = arguments["tripId"] as? String
      else {
        result(false)
        return
      }

      let normalizedTripId = tripId.trimmingCharacters(in: .whitespacesAndNewlines)
      if normalizedTripId.isEmpty {
        result(false)
        return
      }

      let defaults = UserDefaults.standard
      defaults.set(true, forKey: watchdogEnabledKey)
      defaults.set(normalizedTripId, forKey: watchdogTripIdKey)
      startActivityRecognitionUpdates()
      result(scheduleBackgroundWatchdog())

    case "unregisterWatchdog":
      let defaults = UserDefaults.standard
      defaults.set(false, forKey: watchdogEnabledKey)
      defaults.removeObject(forKey: watchdogTripIdKey)
      defaults.removeObject(forKey: watchdogLastHeartbeatMsKey)
      defaults.removeObject(forKey: watchdogLastWakeMsKey)
      defaults.removeObject(forKey: watchdogLastMovingSignalKey)
      stopActivityRecognitionUpdates()
      result(true)

    case "recordHeartbeat":
      guard let arguments = call.arguments as? [String: Any],
        let heartbeatMs = arguments["heartbeatMs"] as? NSNumber
      else {
        result(false)
        return
      }

      let defaults = UserDefaults.standard
      defaults.set(heartbeatMs.int64Value, forKey: watchdogLastHeartbeatMsKey)
      if let movingSignal = arguments["movingSignal"] as? Bool {
        defaults.set(movingSignal, forKey: watchdogLastMovingSignalKey)
      }
      result(true)

    case "readWatchdogSnapshot":
      let defaults = UserDefaults.standard
      var payload: [String: Any] = [
        "enabled": defaults.bool(forKey: watchdogEnabledKey)
      ]

      if let tripId = defaults.string(forKey: watchdogTripIdKey), !tripId.isEmpty {
        payload["tripId"] = tripId
      }
      if defaults.object(forKey: watchdogLastHeartbeatMsKey) != nil {
        payload["lastHeartbeatMs"] = defaults.integer(forKey: watchdogLastHeartbeatMsKey)
      }
      if defaults.object(forKey: watchdogLastWakeMsKey) != nil {
        payload["lastWakeMs"] = defaults.integer(forKey: watchdogLastWakeMsKey)
      }
      if defaults.object(forKey: watchdogLastMovingSignalKey) != nil {
        payload["lastMovingSignal"] = defaults.bool(forKey: watchdogLastMovingSignalKey)
      }

      result(payload)

    default:
      result(FlutterMethodNotImplemented)
    }
  }

  private func scheduleBackgroundWatchdog() -> Bool {
    guard #available(iOS 13.0, *) else {
      return false
    }
    let defaults = UserDefaults.standard
    guard defaults.bool(forKey: watchdogEnabledKey) else {
      return false
    }

    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: watchdogTaskIdentifier)
    let request = BGAppRefreshTaskRequest(identifier: watchdogTaskIdentifier)
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
    do {
      try BGTaskScheduler.shared.submit(request)
      return true
    } catch {
      return false
    }
  }

  @available(iOS 13.0, *)
  private func registerBackgroundWatchdogTask() {
    BGTaskScheduler.shared.register(
      forTaskWithIdentifier: watchdogTaskIdentifier,
      using: nil
    ) { [weak self] task in
      guard let refreshTask = task as? BGAppRefreshTask else {
        task.setTaskCompleted(success: false)
        return
      }
      self?.handleBackgroundWatchdog(task: refreshTask)
    }
  }

  @available(iOS 13.0, *)
  private func handleBackgroundWatchdog(task: BGAppRefreshTask) {
    let defaults = UserDefaults.standard
    let nowMs = Int64(Date().timeIntervalSince1970 * 1000.0)
    defaults.set(nowMs, forKey: watchdogLastWakeMsKey)

    task.expirationHandler = {
      task.setTaskCompleted(success: false)
    }

    _ = scheduleBackgroundWatchdog()
    task.setTaskCompleted(success: true)
  }

  private func startActivityRecognitionUpdates() {
    guard CMMotionActivityManager.isActivityAvailable() else {
      return
    }
    motionActivityQueue.name = "com.neredeservis.motion_activity"
    motionActivityQueue.qualityOfService = .utility

    motionActivityManager.startActivityUpdates(to: motionActivityQueue) { [weak self] activity in
      guard let self = self, let activity = activity else {
        return
      }
      let isMoving =
        activity.automotive || activity.cycling || activity.running || activity.walking
      UserDefaults.standard.set(isMoving, forKey: self.watchdogLastMovingSignalKey)
    }
  }

  private func stopActivityRecognitionUpdates() {
    guard CMMotionActivityManager.isActivityAvailable() else {
      return
    }
    motionActivityManager.stopActivityUpdates()
  }
}
