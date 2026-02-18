import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/route_trace_point_entity.dart';
import 'package:neredeservis/features/domain/mappers/route_trace_point_mapper.dart';
import 'package:neredeservis/features/domain/models/route_trace_point_model.dart';

void main() {
  test('RouteTracePointModel.fromMap + toEntity maps ghost trace point', () {
    final model = RouteTracePointModel.fromMap(
      <String, dynamic>{
        'lat': 40.7671,
        'lng': 29.9402,
        'accuracy': 6.5,
        'sampledAtMs': 1708251000000,
      },
    );

    final entity = model.toEntity();

    expect(entity.lat, closeTo(40.7671, 0.000001));
    expect(entity.lng, closeTo(29.9402, 0.000001));
    expect(entity.accuracy, 6.5);
    expect(entity.sampledAtMs, 1708251000000);
  });

  test('routeTracePointModelFromEntity round-trips to map', () {
    const entity = RouteTracePointEntity(
      lat: 40.8,
      lng: 29.9,
      accuracy: 4.0,
      sampledAtMs: 1708252000000,
    );

    final model = routeTracePointModelFromEntity(entity);
    final map = model.toMap();

    expect(map['lat'], 40.8);
    expect(map['lng'], 29.9);
    expect(map['accuracy'], 4.0);
    expect(map['sampledAtMs'], 1708252000000);
  });
}
