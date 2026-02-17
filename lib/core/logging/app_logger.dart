import 'package:flutter/foundation.dart';

enum LogLevel {
  debug,
  info,
  warning,
  error,
}

abstract class AppLogger {
  const AppLogger();

  void log(
    LogLevel level,
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?> context = const <String, Object?>{},
  });

  void debug(String message, {Map<String, Object?> context = const <String, Object?>{}}) {
    log(LogLevel.debug, message, context: context);
  }

  void info(String message, {Map<String, Object?> context = const <String, Object?>{}}) {
    log(LogLevel.info, message, context: context);
  }

  void warning(String message, {Map<String, Object?> context = const <String, Object?>{}}) {
    log(LogLevel.warning, message, context: context);
  }

  void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?> context = const <String, Object?>{},
  }) {
    log(
      LogLevel.error,
      message,
      error: error,
      stackTrace: stackTrace,
      context: context,
    );
  }
}

class DebugAppLogger extends AppLogger {
  const DebugAppLogger();

  @override
  void log(
    LogLevel level,
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?> context = const <String, Object?>{},
  }) {
    final contextPayload =
        context.isEmpty ? '' : ' | context=${_normalizeContext(context)}';
    final errorPayload = error == null ? '' : ' | error=$error';
    final stackPayload = stackTrace == null ? '' : ' | stack=$stackTrace';
    debugPrint(
      '[${level.name.toUpperCase()}] $message$contextPayload$errorPayload$stackPayload',
    );
  }

  Map<String, String> _normalizeContext(Map<String, Object?> raw) {
    return raw.map(
      (key, value) => MapEntry(key, value?.toString() ?? 'null'),
    );
  }
}
