import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/application/kalman_location_smoother.dart';

void main() {
  test('first sample keeps filtered value equal to raw', () {
    final smoother = KalmanLocationSmoother();
    final point = smoother.update(
      lat: 40.9876,
      lng: 29.1234,
      sampledAtMs: 1000,
    );

    expect(point.filteredLat, point.rawLat);
    expect(point.filteredLng, point.rawLng);
  });

  test('jitter sequence is smoothed compared to raw sequence', () {
    final smoother = KalmanLocationSmoother();
    final rawLat = <double>[40.0000, 40.0007, 39.9994, 40.0009, 39.9996];
    final rawLng = <double>[29.0000, 29.0006, 28.9995, 29.0008, 28.9997];

    var filteredVariation = 0.0;
    var rawVariation = 0.0;
    SmoothedLocationPoint? previousPoint;

    for (var i = 0; i < rawLat.length; i++) {
      final point = smoother.update(
        lat: rawLat[i],
        lng: rawLng[i],
        sampledAtMs: (i + 1) * 1000,
      );
      if (previousPoint != null) {
        rawVariation += (point.rawLat - previousPoint.rawLat).abs() +
            (point.rawLng - previousPoint.rawLng).abs();
        filteredVariation +=
            (point.filteredLat - previousPoint.filteredLat).abs() +
                (point.filteredLng - previousPoint.filteredLng).abs();
      }
      previousPoint = point;
    }

    expect(filteredVariation, lessThan(rawVariation));
  });

  test('after reset first update starts from raw again', () {
    final smoother = KalmanLocationSmoother();
    smoother.update(
      lat: 40.001,
      lng: 29.001,
      sampledAtMs: 1000,
    );
    smoother.reset();

    final point = smoother.update(
      lat: 41.5,
      lng: 30.5,
      sampledAtMs: 2000,
    );

    expect(point.filteredLat, 41.5);
    expect(point.filteredLng, 30.5);
  });
}
