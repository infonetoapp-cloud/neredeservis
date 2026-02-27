import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_analytics/firebase_analytics.dart';

import 'mobile_telemetry.dart';

class FirebaseTelemetrySink {
  FirebaseTelemetrySink._();

  static final FirebaseTelemetrySink _instance = FirebaseTelemetrySink._();
  static FirebaseTelemetrySink get instance => _instance;

  void handleRecord(TelemetryRecord record) {
    if (!record.analyticsEnabled) return;
    if (Firebase.apps.isEmpty) return;

    // Convert attributes to String representation as Firebase Analytics
    // has strict limits on nested objects and types.
    final parameters = <String, Object>{};
    record.attributes.forEach((key, value) {
      if (value != null) {
        parameters[key] = value.toString();
      }
    });

    // Add category and environment as parameters
    parameters['category'] = record.category;
    parameters['env'] = record.environment;

    FirebaseAnalytics.instance.logEvent(
      name: record.eventName.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_'),
      parameters: parameters,
    );
  }
}
