import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/storage/local_storage.dart';

final localStorageProvider = Provider<LocalStorage>((ref) {
  return InMemoryLocalStorage();
});
