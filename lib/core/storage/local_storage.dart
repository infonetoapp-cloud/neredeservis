abstract class LocalStorage {
  Future<void> writeString(String key, String value);
  Future<String?> readString(String key);
  Future<void> writeBool(String key, bool value);
  Future<bool?> readBool(String key);
  Future<void> remove(String key);
}

class InMemoryLocalStorage implements LocalStorage {
  final Map<String, Object> _store = <String, Object>{};

  @override
  Future<String?> readString(String key) async {
    final value = _store[key];
    return value is String ? value : null;
  }

  @override
  Future<bool?> readBool(String key) async {
    final value = _store[key];
    return value is bool ? value : null;
  }

  @override
  Future<void> writeString(String key, String value) async {
    _store[key] = value;
  }

  @override
  Future<void> writeBool(String key, bool value) async {
    _store[key] = value;
  }

  @override
  Future<void> remove(String key) async {
    _store.remove(key);
  }
}
