import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/notifications/application/passenger_notification_ui_service.dart';

void main() {
  group('PassengerNotificationUiService', () {
    test('builds morning reminder note in target window', () {
      final service = PassengerNotificationUiService(
        nowProvider: () => DateTime.utc(2026, 2, 19, 4, 25),
      );

      final state = service.resolve(
        hasActiveTrip: false,
        routeData: <String, dynamic>{
          'timeSlot': 'morning',
          'scheduledTime': '07:30',
        },
        passengerData: <String, dynamic>{
          'notificationTime': '07:25',
        },
        announcementData: null,
        activeTripData: null,
      );

      expect(state.morningReminderNote, contains('07:30'));
    });

    test('does not build morning reminder when active trip exists', () {
      final service = PassengerNotificationUiService(
        nowProvider: () => DateTime.utc(2026, 2, 19, 4, 25),
      );

      final state = service.resolve(
        hasActiveTrip: true,
        routeData: <String, dynamic>{
          'timeSlot': 'morning',
          'scheduledTime': '07:30',
        },
        passengerData: <String, dynamic>{},
        announcementData: null,
        activeTripData: null,
      );

      expect(state.morningReminderNote, isNull);
    });

    test('resolves custom announcement message first', () {
      final service = PassengerNotificationUiService(
        nowProvider: () => DateTime.utc(2026, 2, 19, 4, 25),
      );

      final state = service.resolve(
        hasActiveTrip: false,
        routeData: null,
        passengerData: null,
        announcementData: <String, dynamic>{
          'templateKey': 'traffic_delay',
          'customText': 'Yol calismasi nedeniyle 5 dk gecikme olabilir.',
        },
        activeTripData: null,
      );

      expect(
        state.announcementNote,
        'Yol calismasi nedeniyle 5 dk gecikme olabilir.',
      );
    });

    test('resolves vacation mode note when vacation is active', () {
      final service = PassengerNotificationUiService(
        nowProvider: () => DateTime.utc(2026, 2, 19, 4, 25),
      );

      final state = service.resolve(
        hasActiveTrip: false,
        routeData: <String, dynamic>{
          'vacationUntil': '2026-02-20T00:00:00.000Z',
        },
        passengerData: null,
        announcementData: null,
        activeTripData: null,
      );

      expect(state.vacationModeNote, contains('Tatil modu aktif'));
      expect(state.vacationModeNote, contains('20.02.2026'));
    });

    test('resolves driver snapshot info from active trip', () {
      final service = PassengerNotificationUiService(
        nowProvider: () => DateTime.utc(2026, 2, 19, 4, 25),
      );

      final state = service.resolve(
        hasActiveTrip: true,
        routeData: null,
        passengerData: null,
        announcementData: null,
        activeTripData: <String, dynamic>{
          'driverSnapshot': <String, dynamic>{
            'name': 'Ahmet Yilmaz',
            'plate': '34ABC123',
            'phone': '0555****11',
          },
        },
      );

      expect(state.driverSnapshot, isNotNull);
      expect(state.driverSnapshot!.name, 'Ahmet Yilmaz');
      expect(state.driverSnapshot!.plate, '34ABC123');
      expect(state.driverSnapshot!.phone, '0555****11');
    });
  });
}
