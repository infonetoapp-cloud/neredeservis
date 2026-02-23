class PassengerDriverSnapshotUi {
  const PassengerDriverSnapshotUi({
    required this.name,
    required this.plate,
    required this.phone,
  });

  final String name;
  final String plate;
  final String? phone;
}

class PassengerNotificationUiState {
  const PassengerNotificationUiState({
    required this.morningReminderNote,
    required this.announcementNote,
    required this.vacationModeNote,
    required this.driverSnapshot,
  });

  final String? morningReminderNote;
  final String? announcementNote;
  final String? vacationModeNote;
  final PassengerDriverSnapshotUi? driverSnapshot;
}

typedef PassengerNowProvider = DateTime Function();

class PassengerNotificationUiService {
  PassengerNotificationUiService({
    PassengerNowProvider? nowProvider,
  }) : _nowProvider = nowProvider ?? (() => DateTime.now().toUtc());

  final PassengerNowProvider _nowProvider;

  PassengerNotificationUiState resolve({
    required bool hasActiveTrip,
    required Map<String, dynamic>? routeData,
    required Map<String, dynamic>? passengerData,
    required Map<String, dynamic>? announcementData,
    required Map<String, dynamic>? activeTripData,
  }) {
    return PassengerNotificationUiState(
      morningReminderNote: _resolveMorningReminderNote(
        hasActiveTrip: hasActiveTrip,
        routeData: routeData,
        passengerData: passengerData,
      ),
      announcementNote: _resolveAnnouncementNote(announcementData),
      vacationModeNote: _resolveVacationModeNote(routeData),
      driverSnapshot: _resolveDriverSnapshot(activeTripData),
    );
  }

  String? _resolveMorningReminderNote({
    required bool hasActiveTrip,
    required Map<String, dynamic>? routeData,
    required Map<String, dynamic>? passengerData,
  }) {
    if (hasActiveTrip) {
      return null;
    }

    final routeTimeSlot = (routeData?['timeSlot'] as String?)?.trim();
    if (routeTimeSlot != 'morning') {
      return null;
    }

    final scheduledTime = (routeData?['scheduledTime'] as String?)?.trim();
    final scheduledMinuteOfDay = _parseMinuteOfDay(scheduledTime);
    if (scheduledMinuteOfDay == null) {
      return null;
    }

    final notificationTime =
        (passengerData?['notificationTime'] as String?)?.trim();
    final notificationMinuteOfDay = _parseMinuteOfDay(notificationTime);
    final nowIstanbul = _nowProvider().add(const Duration(hours: 3));
    final nowMinuteOfDay = nowIstanbul.hour * 60 + nowIstanbul.minute;
    final targetMinuteOfDay = (scheduledMinuteOfDay - 5 + 24 * 60) % (24 * 60);
    final minutesSinceTarget =
        _positiveCircularDiff(nowMinuteOfDay, targetMinuteOfDay);

    if (minutesSinceTarget > 10) {
      return null;
    }

    if (notificationMinuteOfDay != null) {
      final minutesSincePreferred =
          _positiveCircularDiff(nowMinuteOfDay, notificationMinuteOfDay);
      if (minutesSincePreferred > 15) {
        return null;
      }
    }

    return 'Sabah hatirlatmasi: kalkis saati yaklasiyor ($scheduledTime).';
  }

  String? _resolveAnnouncementNote(Map<String, dynamic>? announcementData) {
    if (announcementData == null) {
      return null;
    }
    final customText = (announcementData['customText'] as String?)?.trim();
    if (customText != null && customText.isNotEmpty) {
      return customText;
    }

    final templateKey = (announcementData['templateKey'] as String?)?.trim();
    switch (templateKey) {
      case 'traffic_delay':
        return 'Trafik nedeniyle gecikme riski var.';
      case 'trip_started':
        return 'Servis sefere basladi.';
      case 'custom_text':
        return null;
      default:
        return templateKey == null || templateKey.isEmpty
            ? null
            : 'Şoförden yeni duyuru var.';
    }
  }

  String? _resolveVacationModeNote(Map<String, dynamic>? routeData) {
    final vacationUntilRaw = (routeData?['vacationUntil'] as String?)?.trim();
    if (vacationUntilRaw == null || vacationUntilRaw.isEmpty) {
      return null;
    }
    final vacationUntilUtc = DateTime.tryParse(vacationUntilRaw)?.toUtc();
    if (vacationUntilUtc == null) {
      return null;
    }

    final nowUtc = _nowProvider();
    if (!vacationUntilUtc.isAfter(nowUtc)) {
      return null;
    }

    final vacationUntilIstanbul =
        vacationUntilUtc.add(const Duration(hours: 3));
    final day = vacationUntilIstanbul.day.toString().padLeft(2, '0');
    final month = vacationUntilIstanbul.month.toString().padLeft(2, '0');
    final year = vacationUntilIstanbul.year.toString();
    return 'Tatil modu aktif. Donus: $day.$month.$year';
  }

  PassengerDriverSnapshotUi? _resolveDriverSnapshot(
    Map<String, dynamic>? activeTripData,
  ) {
    final rawSnapshot = activeTripData?['driverSnapshot'];
    if (rawSnapshot is! Map) {
      return null;
    }
    final snapshot = Map<String, dynamic>.from(rawSnapshot);
    final name = (snapshot['name'] as String?)?.trim() ?? '';
    final plate = (snapshot['plate'] as String?)?.trim() ?? '';
    final phone = (snapshot['phone'] as String?)?.trim();
    final normalizedPhone = (phone == null || phone.isEmpty) ? null : phone;

    if (name.isEmpty && plate.isEmpty && normalizedPhone == null) {
      return null;
    }

    return PassengerDriverSnapshotUi(
      name: name.isEmpty ? 'Şoför' : name,
      plate: plate.isEmpty ? '-' : plate,
      phone: normalizedPhone,
    );
  }

  int? _parseMinuteOfDay(String? value) {
    if (value == null ||
        !RegExp(r'^([01]\d|2[0-3]):[0-5]\d$').hasMatch(value)) {
      return null;
    }
    final parts = value.split(':');
    if (parts.length != 2) {
      return null;
    }
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) {
      return null;
    }
    return hour * 60 + minute;
  }

  int _positiveCircularDiff(int currentMinuteOfDay, int previousMinuteOfDay) {
    return (currentMinuteOfDay - previousMinuteOfDay + 24 * 60) % (24 * 60);
  }
}
