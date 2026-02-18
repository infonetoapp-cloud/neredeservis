import 'package:firebase_database/firebase_database.dart';

import '../../../services/repository_interfaces.dart';
import '../entities/live_location_entity.dart';
import '../mappers/live_location_mapper.dart';
import '../models/live_location_model.dart';

class RtdbLiveLocationRepository implements LiveLocationRepository {
  RtdbLiveLocationRepository({
    FirebaseDatabase? database,
  }) : _database = database ?? FirebaseDatabase.instance;

  final FirebaseDatabase _database;

  DatabaseReference get _locationsRef => _database.ref('locations');

  DatabaseReference _locationRef(String routeId) {
    return _locationsRef.child(routeId);
  }

  @override
  Stream<LiveLocationEntity?> watchLiveLocation(String routeId) {
    return _locationRef(routeId).onValue.map((event) {
      final map = _mapFromRtdbValue(event.snapshot.value);
      if (map == null) {
        return null;
      }
      return LiveLocationModel.fromMap(map, routeId: routeId).toEntity();
    });
  }

  @override
  Future<LiveLocationEntity?> getLiveLocation(String routeId) async {
    final snapshot = await _locationRef(routeId).get();
    final map = _mapFromRtdbValue(snapshot.value);
    if (map == null) {
      return null;
    }
    return LiveLocationModel.fromMap(map, routeId: routeId).toEntity();
  }

  @override
  Future<void> upsertLiveLocation(LiveLocationEntity location) async {
    final model = liveLocationModelFromEntity(location);
    await _locationRef(location.routeId).set(model.toMap());
  }

  @override
  Future<void> clearLiveLocation(String routeId) {
    return _locationRef(routeId).remove();
  }
}

Map<String, dynamic>? _mapFromRtdbValue(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is! Map<Object?, Object?>) {
    return null;
  }

  final output = <String, dynamic>{};
  for (final entry in value.entries) {
    output[entry.key.toString()] = entry.value;
  }
  return output;
}
