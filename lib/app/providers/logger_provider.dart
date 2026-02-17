import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/logging/app_logger.dart';

final appLoggerProvider = Provider<AppLogger>((ref) {
  return const DebugAppLogger();
});
