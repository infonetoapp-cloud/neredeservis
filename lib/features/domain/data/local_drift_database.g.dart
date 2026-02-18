// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'local_drift_database.dart';

// ignore_for_file: type=lint
class $LocationQueueTableTable extends LocationQueueTable
    with TableInfo<$LocationQueueTableTable, LocationQueueTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocationQueueTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _ownerUidMeta =
      const VerificationMeta('ownerUid');
  @override
  late final GeneratedColumn<String> ownerUid = GeneratedColumn<String>(
      'owner_uid', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _routeIdMeta =
      const VerificationMeta('routeId');
  @override
  late final GeneratedColumn<String> routeId = GeneratedColumn<String>(
      'route_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tripIdMeta = const VerificationMeta('tripId');
  @override
  late final GeneratedColumn<String> tripId = GeneratedColumn<String>(
      'trip_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _latMeta = const VerificationMeta('lat');
  @override
  late final GeneratedColumn<double> lat = GeneratedColumn<double>(
      'lat', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _lngMeta = const VerificationMeta('lng');
  @override
  late final GeneratedColumn<double> lng = GeneratedColumn<double>(
      'lng', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _speedMeta = const VerificationMeta('speed');
  @override
  late final GeneratedColumn<double> speed = GeneratedColumn<double>(
      'speed', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _headingMeta =
      const VerificationMeta('heading');
  @override
  late final GeneratedColumn<double> heading = GeneratedColumn<double>(
      'heading', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _accuracyMeta =
      const VerificationMeta('accuracy');
  @override
  late final GeneratedColumn<double> accuracy = GeneratedColumn<double>(
      'accuracy', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _sampledAtMeta =
      const VerificationMeta('sampledAt');
  @override
  late final GeneratedColumn<int> sampledAt = GeneratedColumn<int>(
      'sampled_at', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<int> createdAt = GeneratedColumn<int>(
      'created_at', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _nextRetryAtMeta =
      const VerificationMeta('nextRetryAt');
  @override
  late final GeneratedColumn<int> nextRetryAt = GeneratedColumn<int>(
      'next_retry_at', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        ownerUid,
        routeId,
        tripId,
        lat,
        lng,
        speed,
        heading,
        accuracy,
        sampledAt,
        createdAt,
        retryCount,
        nextRetryAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'location_queue';
  @override
  VerificationContext validateIntegrity(
      Insertable<LocationQueueTableData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('owner_uid')) {
      context.handle(_ownerUidMeta,
          ownerUid.isAcceptableOrUnknown(data['owner_uid']!, _ownerUidMeta));
    } else if (isInserting) {
      context.missing(_ownerUidMeta);
    }
    if (data.containsKey('route_id')) {
      context.handle(_routeIdMeta,
          routeId.isAcceptableOrUnknown(data['route_id']!, _routeIdMeta));
    } else if (isInserting) {
      context.missing(_routeIdMeta);
    }
    if (data.containsKey('trip_id')) {
      context.handle(_tripIdMeta,
          tripId.isAcceptableOrUnknown(data['trip_id']!, _tripIdMeta));
    }
    if (data.containsKey('lat')) {
      context.handle(
          _latMeta, lat.isAcceptableOrUnknown(data['lat']!, _latMeta));
    } else if (isInserting) {
      context.missing(_latMeta);
    }
    if (data.containsKey('lng')) {
      context.handle(
          _lngMeta, lng.isAcceptableOrUnknown(data['lng']!, _lngMeta));
    } else if (isInserting) {
      context.missing(_lngMeta);
    }
    if (data.containsKey('speed')) {
      context.handle(
          _speedMeta, speed.isAcceptableOrUnknown(data['speed']!, _speedMeta));
    }
    if (data.containsKey('heading')) {
      context.handle(_headingMeta,
          heading.isAcceptableOrUnknown(data['heading']!, _headingMeta));
    }
    if (data.containsKey('accuracy')) {
      context.handle(_accuracyMeta,
          accuracy.isAcceptableOrUnknown(data['accuracy']!, _accuracyMeta));
    } else if (isInserting) {
      context.missing(_accuracyMeta);
    }
    if (data.containsKey('sampled_at')) {
      context.handle(_sampledAtMeta,
          sampledAt.isAcceptableOrUnknown(data['sampled_at']!, _sampledAtMeta));
    } else if (isInserting) {
      context.missing(_sampledAtMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    if (data.containsKey('next_retry_at')) {
      context.handle(
          _nextRetryAtMeta,
          nextRetryAt.isAcceptableOrUnknown(
              data['next_retry_at']!, _nextRetryAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocationQueueTableData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocationQueueTableData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      ownerUid: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}owner_uid'])!,
      routeId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}route_id'])!,
      tripId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}trip_id']),
      lat: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}lat'])!,
      lng: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}lng'])!,
      speed: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}speed']),
      heading: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}heading']),
      accuracy: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}accuracy'])!,
      sampledAt: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sampled_at'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}created_at'])!,
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
      nextRetryAt: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}next_retry_at']),
    );
  }

  @override
  $LocationQueueTableTable createAlias(String alias) {
    return $LocationQueueTableTable(attachedDatabase, alias);
  }
}

class LocationQueueTableData extends DataClass
    implements Insertable<LocationQueueTableData> {
  final int id;
  final String ownerUid;
  final String routeId;
  final String? tripId;
  final double lat;
  final double lng;
  final double? speed;
  final double? heading;
  final double accuracy;
  final int sampledAt;
  final int createdAt;
  final int retryCount;
  final int? nextRetryAt;
  const LocationQueueTableData(
      {required this.id,
      required this.ownerUid,
      required this.routeId,
      this.tripId,
      required this.lat,
      required this.lng,
      this.speed,
      this.heading,
      required this.accuracy,
      required this.sampledAt,
      required this.createdAt,
      required this.retryCount,
      this.nextRetryAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['owner_uid'] = Variable<String>(ownerUid);
    map['route_id'] = Variable<String>(routeId);
    if (!nullToAbsent || tripId != null) {
      map['trip_id'] = Variable<String>(tripId);
    }
    map['lat'] = Variable<double>(lat);
    map['lng'] = Variable<double>(lng);
    if (!nullToAbsent || speed != null) {
      map['speed'] = Variable<double>(speed);
    }
    if (!nullToAbsent || heading != null) {
      map['heading'] = Variable<double>(heading);
    }
    map['accuracy'] = Variable<double>(accuracy);
    map['sampled_at'] = Variable<int>(sampledAt);
    map['created_at'] = Variable<int>(createdAt);
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || nextRetryAt != null) {
      map['next_retry_at'] = Variable<int>(nextRetryAt);
    }
    return map;
  }

  LocationQueueTableCompanion toCompanion(bool nullToAbsent) {
    return LocationQueueTableCompanion(
      id: Value(id),
      ownerUid: Value(ownerUid),
      routeId: Value(routeId),
      tripId:
          tripId == null && nullToAbsent ? const Value.absent() : Value(tripId),
      lat: Value(lat),
      lng: Value(lng),
      speed:
          speed == null && nullToAbsent ? const Value.absent() : Value(speed),
      heading: heading == null && nullToAbsent
          ? const Value.absent()
          : Value(heading),
      accuracy: Value(accuracy),
      sampledAt: Value(sampledAt),
      createdAt: Value(createdAt),
      retryCount: Value(retryCount),
      nextRetryAt: nextRetryAt == null && nullToAbsent
          ? const Value.absent()
          : Value(nextRetryAt),
    );
  }

  factory LocationQueueTableData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocationQueueTableData(
      id: serializer.fromJson<int>(json['id']),
      ownerUid: serializer.fromJson<String>(json['ownerUid']),
      routeId: serializer.fromJson<String>(json['routeId']),
      tripId: serializer.fromJson<String?>(json['tripId']),
      lat: serializer.fromJson<double>(json['lat']),
      lng: serializer.fromJson<double>(json['lng']),
      speed: serializer.fromJson<double?>(json['speed']),
      heading: serializer.fromJson<double?>(json['heading']),
      accuracy: serializer.fromJson<double>(json['accuracy']),
      sampledAt: serializer.fromJson<int>(json['sampledAt']),
      createdAt: serializer.fromJson<int>(json['createdAt']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      nextRetryAt: serializer.fromJson<int?>(json['nextRetryAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'ownerUid': serializer.toJson<String>(ownerUid),
      'routeId': serializer.toJson<String>(routeId),
      'tripId': serializer.toJson<String?>(tripId),
      'lat': serializer.toJson<double>(lat),
      'lng': serializer.toJson<double>(lng),
      'speed': serializer.toJson<double?>(speed),
      'heading': serializer.toJson<double?>(heading),
      'accuracy': serializer.toJson<double>(accuracy),
      'sampledAt': serializer.toJson<int>(sampledAt),
      'createdAt': serializer.toJson<int>(createdAt),
      'retryCount': serializer.toJson<int>(retryCount),
      'nextRetryAt': serializer.toJson<int?>(nextRetryAt),
    };
  }

  LocationQueueTableData copyWith(
          {int? id,
          String? ownerUid,
          String? routeId,
          Value<String?> tripId = const Value.absent(),
          double? lat,
          double? lng,
          Value<double?> speed = const Value.absent(),
          Value<double?> heading = const Value.absent(),
          double? accuracy,
          int? sampledAt,
          int? createdAt,
          int? retryCount,
          Value<int?> nextRetryAt = const Value.absent()}) =>
      LocationQueueTableData(
        id: id ?? this.id,
        ownerUid: ownerUid ?? this.ownerUid,
        routeId: routeId ?? this.routeId,
        tripId: tripId.present ? tripId.value : this.tripId,
        lat: lat ?? this.lat,
        lng: lng ?? this.lng,
        speed: speed.present ? speed.value : this.speed,
        heading: heading.present ? heading.value : this.heading,
        accuracy: accuracy ?? this.accuracy,
        sampledAt: sampledAt ?? this.sampledAt,
        createdAt: createdAt ?? this.createdAt,
        retryCount: retryCount ?? this.retryCount,
        nextRetryAt: nextRetryAt.present ? nextRetryAt.value : this.nextRetryAt,
      );
  LocationQueueTableData copyWithCompanion(LocationQueueTableCompanion data) {
    return LocationQueueTableData(
      id: data.id.present ? data.id.value : this.id,
      ownerUid: data.ownerUid.present ? data.ownerUid.value : this.ownerUid,
      routeId: data.routeId.present ? data.routeId.value : this.routeId,
      tripId: data.tripId.present ? data.tripId.value : this.tripId,
      lat: data.lat.present ? data.lat.value : this.lat,
      lng: data.lng.present ? data.lng.value : this.lng,
      speed: data.speed.present ? data.speed.value : this.speed,
      heading: data.heading.present ? data.heading.value : this.heading,
      accuracy: data.accuracy.present ? data.accuracy.value : this.accuracy,
      sampledAt: data.sampledAt.present ? data.sampledAt.value : this.sampledAt,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      retryCount:
          data.retryCount.present ? data.retryCount.value : this.retryCount,
      nextRetryAt:
          data.nextRetryAt.present ? data.nextRetryAt.value : this.nextRetryAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocationQueueTableData(')
          ..write('id: $id, ')
          ..write('ownerUid: $ownerUid, ')
          ..write('routeId: $routeId, ')
          ..write('tripId: $tripId, ')
          ..write('lat: $lat, ')
          ..write('lng: $lng, ')
          ..write('speed: $speed, ')
          ..write('heading: $heading, ')
          ..write('accuracy: $accuracy, ')
          ..write('sampledAt: $sampledAt, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('nextRetryAt: $nextRetryAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, ownerUid, routeId, tripId, lat, lng,
      speed, heading, accuracy, sampledAt, createdAt, retryCount, nextRetryAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocationQueueTableData &&
          other.id == this.id &&
          other.ownerUid == this.ownerUid &&
          other.routeId == this.routeId &&
          other.tripId == this.tripId &&
          other.lat == this.lat &&
          other.lng == this.lng &&
          other.speed == this.speed &&
          other.heading == this.heading &&
          other.accuracy == this.accuracy &&
          other.sampledAt == this.sampledAt &&
          other.createdAt == this.createdAt &&
          other.retryCount == this.retryCount &&
          other.nextRetryAt == this.nextRetryAt);
}

class LocationQueueTableCompanion
    extends UpdateCompanion<LocationQueueTableData> {
  final Value<int> id;
  final Value<String> ownerUid;
  final Value<String> routeId;
  final Value<String?> tripId;
  final Value<double> lat;
  final Value<double> lng;
  final Value<double?> speed;
  final Value<double?> heading;
  final Value<double> accuracy;
  final Value<int> sampledAt;
  final Value<int> createdAt;
  final Value<int> retryCount;
  final Value<int?> nextRetryAt;
  const LocationQueueTableCompanion({
    this.id = const Value.absent(),
    this.ownerUid = const Value.absent(),
    this.routeId = const Value.absent(),
    this.tripId = const Value.absent(),
    this.lat = const Value.absent(),
    this.lng = const Value.absent(),
    this.speed = const Value.absent(),
    this.heading = const Value.absent(),
    this.accuracy = const Value.absent(),
    this.sampledAt = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.nextRetryAt = const Value.absent(),
  });
  LocationQueueTableCompanion.insert({
    this.id = const Value.absent(),
    required String ownerUid,
    required String routeId,
    this.tripId = const Value.absent(),
    required double lat,
    required double lng,
    this.speed = const Value.absent(),
    this.heading = const Value.absent(),
    required double accuracy,
    required int sampledAt,
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.nextRetryAt = const Value.absent(),
  })  : ownerUid = Value(ownerUid),
        routeId = Value(routeId),
        lat = Value(lat),
        lng = Value(lng),
        accuracy = Value(accuracy),
        sampledAt = Value(sampledAt);
  static Insertable<LocationQueueTableData> custom({
    Expression<int>? id,
    Expression<String>? ownerUid,
    Expression<String>? routeId,
    Expression<String>? tripId,
    Expression<double>? lat,
    Expression<double>? lng,
    Expression<double>? speed,
    Expression<double>? heading,
    Expression<double>? accuracy,
    Expression<int>? sampledAt,
    Expression<int>? createdAt,
    Expression<int>? retryCount,
    Expression<int>? nextRetryAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (ownerUid != null) 'owner_uid': ownerUid,
      if (routeId != null) 'route_id': routeId,
      if (tripId != null) 'trip_id': tripId,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (speed != null) 'speed': speed,
      if (heading != null) 'heading': heading,
      if (accuracy != null) 'accuracy': accuracy,
      if (sampledAt != null) 'sampled_at': sampledAt,
      if (createdAt != null) 'created_at': createdAt,
      if (retryCount != null) 'retry_count': retryCount,
      if (nextRetryAt != null) 'next_retry_at': nextRetryAt,
    });
  }

  LocationQueueTableCompanion copyWith(
      {Value<int>? id,
      Value<String>? ownerUid,
      Value<String>? routeId,
      Value<String?>? tripId,
      Value<double>? lat,
      Value<double>? lng,
      Value<double?>? speed,
      Value<double?>? heading,
      Value<double>? accuracy,
      Value<int>? sampledAt,
      Value<int>? createdAt,
      Value<int>? retryCount,
      Value<int?>? nextRetryAt}) {
    return LocationQueueTableCompanion(
      id: id ?? this.id,
      ownerUid: ownerUid ?? this.ownerUid,
      routeId: routeId ?? this.routeId,
      tripId: tripId ?? this.tripId,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      speed: speed ?? this.speed,
      heading: heading ?? this.heading,
      accuracy: accuracy ?? this.accuracy,
      sampledAt: sampledAt ?? this.sampledAt,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
      nextRetryAt: nextRetryAt ?? this.nextRetryAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (ownerUid.present) {
      map['owner_uid'] = Variable<String>(ownerUid.value);
    }
    if (routeId.present) {
      map['route_id'] = Variable<String>(routeId.value);
    }
    if (tripId.present) {
      map['trip_id'] = Variable<String>(tripId.value);
    }
    if (lat.present) {
      map['lat'] = Variable<double>(lat.value);
    }
    if (lng.present) {
      map['lng'] = Variable<double>(lng.value);
    }
    if (speed.present) {
      map['speed'] = Variable<double>(speed.value);
    }
    if (heading.present) {
      map['heading'] = Variable<double>(heading.value);
    }
    if (accuracy.present) {
      map['accuracy'] = Variable<double>(accuracy.value);
    }
    if (sampledAt.present) {
      map['sampled_at'] = Variable<int>(sampledAt.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<int>(createdAt.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (nextRetryAt.present) {
      map['next_retry_at'] = Variable<int>(nextRetryAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocationQueueTableCompanion(')
          ..write('id: $id, ')
          ..write('ownerUid: $ownerUid, ')
          ..write('routeId: $routeId, ')
          ..write('tripId: $tripId, ')
          ..write('lat: $lat, ')
          ..write('lng: $lng, ')
          ..write('speed: $speed, ')
          ..write('heading: $heading, ')
          ..write('accuracy: $accuracy, ')
          ..write('sampledAt: $sampledAt, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('nextRetryAt: $nextRetryAt')
          ..write(')'))
        .toString();
  }
}

class $TripActionQueueTableTable extends TripActionQueueTable
    with TableInfo<$TripActionQueueTableTable, TripActionQueueTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TripActionQueueTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _ownerUidMeta =
      const VerificationMeta('ownerUid');
  @override
  late final GeneratedColumn<String> ownerUid = GeneratedColumn<String>(
      'owner_uid', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _actionTypeMeta =
      const VerificationMeta('actionType');
  @override
  late final GeneratedColumn<String> actionType = GeneratedColumn<String>(
      'action_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _idempotencyKeyMeta =
      const VerificationMeta('idempotencyKey');
  @override
  late final GeneratedColumn<String> idempotencyKey = GeneratedColumn<String>(
      'idempotency_key', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<int> createdAt = GeneratedColumn<int>(
      'created_at', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _failedRetryCountMeta =
      const VerificationMeta('failedRetryCount');
  @override
  late final GeneratedColumn<int> failedRetryCount = GeneratedColumn<int>(
      'failed_retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _nextRetryAtMeta =
      const VerificationMeta('nextRetryAt');
  @override
  late final GeneratedColumn<int> nextRetryAt = GeneratedColumn<int>(
      'next_retry_at', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _lastErrorCodeMeta =
      const VerificationMeta('lastErrorCode');
  @override
  late final GeneratedColumn<String> lastErrorCode = GeneratedColumn<String>(
      'last_error_code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _lastErrorAtMeta =
      const VerificationMeta('lastErrorAt');
  @override
  late final GeneratedColumn<int> lastErrorAt = GeneratedColumn<int>(
      'last_error_at', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _maxRetryReachedAtMeta =
      const VerificationMeta('maxRetryReachedAt');
  @override
  late final GeneratedColumn<int> maxRetryReachedAt = GeneratedColumn<int>(
      'max_retry_reached_at', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _localMetaMeta =
      const VerificationMeta('localMeta');
  @override
  late final GeneratedColumn<String> localMeta = GeneratedColumn<String>(
      'local_meta', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        ownerUid,
        actionType,
        status,
        payloadJson,
        idempotencyKey,
        createdAt,
        failedRetryCount,
        retryCount,
        nextRetryAt,
        lastErrorCode,
        lastErrorAt,
        maxRetryReachedAt,
        localMeta
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'trip_action_queue';
  @override
  VerificationContext validateIntegrity(
      Insertable<TripActionQueueTableData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('owner_uid')) {
      context.handle(_ownerUidMeta,
          ownerUid.isAcceptableOrUnknown(data['owner_uid']!, _ownerUidMeta));
    } else if (isInserting) {
      context.missing(_ownerUidMeta);
    }
    if (data.containsKey('action_type')) {
      context.handle(
          _actionTypeMeta,
          actionType.isAcceptableOrUnknown(
              data['action_type']!, _actionTypeMeta));
    } else if (isInserting) {
      context.missing(_actionTypeMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('idempotency_key')) {
      context.handle(
          _idempotencyKeyMeta,
          idempotencyKey.isAcceptableOrUnknown(
              data['idempotency_key']!, _idempotencyKeyMeta));
    } else if (isInserting) {
      context.missing(_idempotencyKeyMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('failed_retry_count')) {
      context.handle(
          _failedRetryCountMeta,
          failedRetryCount.isAcceptableOrUnknown(
              data['failed_retry_count']!, _failedRetryCountMeta));
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    if (data.containsKey('next_retry_at')) {
      context.handle(
          _nextRetryAtMeta,
          nextRetryAt.isAcceptableOrUnknown(
              data['next_retry_at']!, _nextRetryAtMeta));
    }
    if (data.containsKey('last_error_code')) {
      context.handle(
          _lastErrorCodeMeta,
          lastErrorCode.isAcceptableOrUnknown(
              data['last_error_code']!, _lastErrorCodeMeta));
    }
    if (data.containsKey('last_error_at')) {
      context.handle(
          _lastErrorAtMeta,
          lastErrorAt.isAcceptableOrUnknown(
              data['last_error_at']!, _lastErrorAtMeta));
    }
    if (data.containsKey('max_retry_reached_at')) {
      context.handle(
          _maxRetryReachedAtMeta,
          maxRetryReachedAt.isAcceptableOrUnknown(
              data['max_retry_reached_at']!, _maxRetryReachedAtMeta));
    }
    if (data.containsKey('local_meta')) {
      context.handle(_localMetaMeta,
          localMeta.isAcceptableOrUnknown(data['local_meta']!, _localMetaMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  TripActionQueueTableData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TripActionQueueTableData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      ownerUid: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}owner_uid'])!,
      actionType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}action_type'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      idempotencyKey: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}idempotency_key'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}created_at'])!,
      failedRetryCount: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}failed_retry_count'])!,
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
      nextRetryAt: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}next_retry_at']),
      lastErrorCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_error_code']),
      lastErrorAt: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}last_error_at']),
      maxRetryReachedAt: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}max_retry_reached_at']),
      localMeta: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}local_meta']),
    );
  }

  @override
  $TripActionQueueTableTable createAlias(String alias) {
    return $TripActionQueueTableTable(attachedDatabase, alias);
  }
}

class TripActionQueueTableData extends DataClass
    implements Insertable<TripActionQueueTableData> {
  final int id;
  final String ownerUid;
  final String actionType;
  final String status;
  final String payloadJson;
  final String idempotencyKey;
  final int createdAt;
  final int failedRetryCount;
  final int retryCount;
  final int? nextRetryAt;
  final String? lastErrorCode;
  final int? lastErrorAt;
  final int? maxRetryReachedAt;
  final String? localMeta;
  const TripActionQueueTableData(
      {required this.id,
      required this.ownerUid,
      required this.actionType,
      required this.status,
      required this.payloadJson,
      required this.idempotencyKey,
      required this.createdAt,
      required this.failedRetryCount,
      required this.retryCount,
      this.nextRetryAt,
      this.lastErrorCode,
      this.lastErrorAt,
      this.maxRetryReachedAt,
      this.localMeta});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['owner_uid'] = Variable<String>(ownerUid);
    map['action_type'] = Variable<String>(actionType);
    map['status'] = Variable<String>(status);
    map['payload_json'] = Variable<String>(payloadJson);
    map['idempotency_key'] = Variable<String>(idempotencyKey);
    map['created_at'] = Variable<int>(createdAt);
    map['failed_retry_count'] = Variable<int>(failedRetryCount);
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || nextRetryAt != null) {
      map['next_retry_at'] = Variable<int>(nextRetryAt);
    }
    if (!nullToAbsent || lastErrorCode != null) {
      map['last_error_code'] = Variable<String>(lastErrorCode);
    }
    if (!nullToAbsent || lastErrorAt != null) {
      map['last_error_at'] = Variable<int>(lastErrorAt);
    }
    if (!nullToAbsent || maxRetryReachedAt != null) {
      map['max_retry_reached_at'] = Variable<int>(maxRetryReachedAt);
    }
    if (!nullToAbsent || localMeta != null) {
      map['local_meta'] = Variable<String>(localMeta);
    }
    return map;
  }

  TripActionQueueTableCompanion toCompanion(bool nullToAbsent) {
    return TripActionQueueTableCompanion(
      id: Value(id),
      ownerUid: Value(ownerUid),
      actionType: Value(actionType),
      status: Value(status),
      payloadJson: Value(payloadJson),
      idempotencyKey: Value(idempotencyKey),
      createdAt: Value(createdAt),
      failedRetryCount: Value(failedRetryCount),
      retryCount: Value(retryCount),
      nextRetryAt: nextRetryAt == null && nullToAbsent
          ? const Value.absent()
          : Value(nextRetryAt),
      lastErrorCode: lastErrorCode == null && nullToAbsent
          ? const Value.absent()
          : Value(lastErrorCode),
      lastErrorAt: lastErrorAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastErrorAt),
      maxRetryReachedAt: maxRetryReachedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(maxRetryReachedAt),
      localMeta: localMeta == null && nullToAbsent
          ? const Value.absent()
          : Value(localMeta),
    );
  }

  factory TripActionQueueTableData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TripActionQueueTableData(
      id: serializer.fromJson<int>(json['id']),
      ownerUid: serializer.fromJson<String>(json['ownerUid']),
      actionType: serializer.fromJson<String>(json['actionType']),
      status: serializer.fromJson<String>(json['status']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      idempotencyKey: serializer.fromJson<String>(json['idempotencyKey']),
      createdAt: serializer.fromJson<int>(json['createdAt']),
      failedRetryCount: serializer.fromJson<int>(json['failedRetryCount']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      nextRetryAt: serializer.fromJson<int?>(json['nextRetryAt']),
      lastErrorCode: serializer.fromJson<String?>(json['lastErrorCode']),
      lastErrorAt: serializer.fromJson<int?>(json['lastErrorAt']),
      maxRetryReachedAt: serializer.fromJson<int?>(json['maxRetryReachedAt']),
      localMeta: serializer.fromJson<String?>(json['localMeta']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'ownerUid': serializer.toJson<String>(ownerUid),
      'actionType': serializer.toJson<String>(actionType),
      'status': serializer.toJson<String>(status),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'idempotencyKey': serializer.toJson<String>(idempotencyKey),
      'createdAt': serializer.toJson<int>(createdAt),
      'failedRetryCount': serializer.toJson<int>(failedRetryCount),
      'retryCount': serializer.toJson<int>(retryCount),
      'nextRetryAt': serializer.toJson<int?>(nextRetryAt),
      'lastErrorCode': serializer.toJson<String?>(lastErrorCode),
      'lastErrorAt': serializer.toJson<int?>(lastErrorAt),
      'maxRetryReachedAt': serializer.toJson<int?>(maxRetryReachedAt),
      'localMeta': serializer.toJson<String?>(localMeta),
    };
  }

  TripActionQueueTableData copyWith(
          {int? id,
          String? ownerUid,
          String? actionType,
          String? status,
          String? payloadJson,
          String? idempotencyKey,
          int? createdAt,
          int? failedRetryCount,
          int? retryCount,
          Value<int?> nextRetryAt = const Value.absent(),
          Value<String?> lastErrorCode = const Value.absent(),
          Value<int?> lastErrorAt = const Value.absent(),
          Value<int?> maxRetryReachedAt = const Value.absent(),
          Value<String?> localMeta = const Value.absent()}) =>
      TripActionQueueTableData(
        id: id ?? this.id,
        ownerUid: ownerUid ?? this.ownerUid,
        actionType: actionType ?? this.actionType,
        status: status ?? this.status,
        payloadJson: payloadJson ?? this.payloadJson,
        idempotencyKey: idempotencyKey ?? this.idempotencyKey,
        createdAt: createdAt ?? this.createdAt,
        failedRetryCount: failedRetryCount ?? this.failedRetryCount,
        retryCount: retryCount ?? this.retryCount,
        nextRetryAt: nextRetryAt.present ? nextRetryAt.value : this.nextRetryAt,
        lastErrorCode:
            lastErrorCode.present ? lastErrorCode.value : this.lastErrorCode,
        lastErrorAt: lastErrorAt.present ? lastErrorAt.value : this.lastErrorAt,
        maxRetryReachedAt: maxRetryReachedAt.present
            ? maxRetryReachedAt.value
            : this.maxRetryReachedAt,
        localMeta: localMeta.present ? localMeta.value : this.localMeta,
      );
  TripActionQueueTableData copyWithCompanion(
      TripActionQueueTableCompanion data) {
    return TripActionQueueTableData(
      id: data.id.present ? data.id.value : this.id,
      ownerUid: data.ownerUid.present ? data.ownerUid.value : this.ownerUid,
      actionType:
          data.actionType.present ? data.actionType.value : this.actionType,
      status: data.status.present ? data.status.value : this.status,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      idempotencyKey: data.idempotencyKey.present
          ? data.idempotencyKey.value
          : this.idempotencyKey,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      failedRetryCount: data.failedRetryCount.present
          ? data.failedRetryCount.value
          : this.failedRetryCount,
      retryCount:
          data.retryCount.present ? data.retryCount.value : this.retryCount,
      nextRetryAt:
          data.nextRetryAt.present ? data.nextRetryAt.value : this.nextRetryAt,
      lastErrorCode: data.lastErrorCode.present
          ? data.lastErrorCode.value
          : this.lastErrorCode,
      lastErrorAt:
          data.lastErrorAt.present ? data.lastErrorAt.value : this.lastErrorAt,
      maxRetryReachedAt: data.maxRetryReachedAt.present
          ? data.maxRetryReachedAt.value
          : this.maxRetryReachedAt,
      localMeta: data.localMeta.present ? data.localMeta.value : this.localMeta,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TripActionQueueTableData(')
          ..write('id: $id, ')
          ..write('ownerUid: $ownerUid, ')
          ..write('actionType: $actionType, ')
          ..write('status: $status, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('idempotencyKey: $idempotencyKey, ')
          ..write('createdAt: $createdAt, ')
          ..write('failedRetryCount: $failedRetryCount, ')
          ..write('retryCount: $retryCount, ')
          ..write('nextRetryAt: $nextRetryAt, ')
          ..write('lastErrorCode: $lastErrorCode, ')
          ..write('lastErrorAt: $lastErrorAt, ')
          ..write('maxRetryReachedAt: $maxRetryReachedAt, ')
          ..write('localMeta: $localMeta')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      ownerUid,
      actionType,
      status,
      payloadJson,
      idempotencyKey,
      createdAt,
      failedRetryCount,
      retryCount,
      nextRetryAt,
      lastErrorCode,
      lastErrorAt,
      maxRetryReachedAt,
      localMeta);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TripActionQueueTableData &&
          other.id == this.id &&
          other.ownerUid == this.ownerUid &&
          other.actionType == this.actionType &&
          other.status == this.status &&
          other.payloadJson == this.payloadJson &&
          other.idempotencyKey == this.idempotencyKey &&
          other.createdAt == this.createdAt &&
          other.failedRetryCount == this.failedRetryCount &&
          other.retryCount == this.retryCount &&
          other.nextRetryAt == this.nextRetryAt &&
          other.lastErrorCode == this.lastErrorCode &&
          other.lastErrorAt == this.lastErrorAt &&
          other.maxRetryReachedAt == this.maxRetryReachedAt &&
          other.localMeta == this.localMeta);
}

class TripActionQueueTableCompanion
    extends UpdateCompanion<TripActionQueueTableData> {
  final Value<int> id;
  final Value<String> ownerUid;
  final Value<String> actionType;
  final Value<String> status;
  final Value<String> payloadJson;
  final Value<String> idempotencyKey;
  final Value<int> createdAt;
  final Value<int> failedRetryCount;
  final Value<int> retryCount;
  final Value<int?> nextRetryAt;
  final Value<String?> lastErrorCode;
  final Value<int?> lastErrorAt;
  final Value<int?> maxRetryReachedAt;
  final Value<String?> localMeta;
  const TripActionQueueTableCompanion({
    this.id = const Value.absent(),
    this.ownerUid = const Value.absent(),
    this.actionType = const Value.absent(),
    this.status = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.idempotencyKey = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.failedRetryCount = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.nextRetryAt = const Value.absent(),
    this.lastErrorCode = const Value.absent(),
    this.lastErrorAt = const Value.absent(),
    this.maxRetryReachedAt = const Value.absent(),
    this.localMeta = const Value.absent(),
  });
  TripActionQueueTableCompanion.insert({
    this.id = const Value.absent(),
    required String ownerUid,
    required String actionType,
    this.status = const Value.absent(),
    required String payloadJson,
    required String idempotencyKey,
    this.createdAt = const Value.absent(),
    this.failedRetryCount = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.nextRetryAt = const Value.absent(),
    this.lastErrorCode = const Value.absent(),
    this.lastErrorAt = const Value.absent(),
    this.maxRetryReachedAt = const Value.absent(),
    this.localMeta = const Value.absent(),
  })  : ownerUid = Value(ownerUid),
        actionType = Value(actionType),
        payloadJson = Value(payloadJson),
        idempotencyKey = Value(idempotencyKey);
  static Insertable<TripActionQueueTableData> custom({
    Expression<int>? id,
    Expression<String>? ownerUid,
    Expression<String>? actionType,
    Expression<String>? status,
    Expression<String>? payloadJson,
    Expression<String>? idempotencyKey,
    Expression<int>? createdAt,
    Expression<int>? failedRetryCount,
    Expression<int>? retryCount,
    Expression<int>? nextRetryAt,
    Expression<String>? lastErrorCode,
    Expression<int>? lastErrorAt,
    Expression<int>? maxRetryReachedAt,
    Expression<String>? localMeta,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (ownerUid != null) 'owner_uid': ownerUid,
      if (actionType != null) 'action_type': actionType,
      if (status != null) 'status': status,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (idempotencyKey != null) 'idempotency_key': idempotencyKey,
      if (createdAt != null) 'created_at': createdAt,
      if (failedRetryCount != null) 'failed_retry_count': failedRetryCount,
      if (retryCount != null) 'retry_count': retryCount,
      if (nextRetryAt != null) 'next_retry_at': nextRetryAt,
      if (lastErrorCode != null) 'last_error_code': lastErrorCode,
      if (lastErrorAt != null) 'last_error_at': lastErrorAt,
      if (maxRetryReachedAt != null) 'max_retry_reached_at': maxRetryReachedAt,
      if (localMeta != null) 'local_meta': localMeta,
    });
  }

  TripActionQueueTableCompanion copyWith(
      {Value<int>? id,
      Value<String>? ownerUid,
      Value<String>? actionType,
      Value<String>? status,
      Value<String>? payloadJson,
      Value<String>? idempotencyKey,
      Value<int>? createdAt,
      Value<int>? failedRetryCount,
      Value<int>? retryCount,
      Value<int?>? nextRetryAt,
      Value<String?>? lastErrorCode,
      Value<int?>? lastErrorAt,
      Value<int?>? maxRetryReachedAt,
      Value<String?>? localMeta}) {
    return TripActionQueueTableCompanion(
      id: id ?? this.id,
      ownerUid: ownerUid ?? this.ownerUid,
      actionType: actionType ?? this.actionType,
      status: status ?? this.status,
      payloadJson: payloadJson ?? this.payloadJson,
      idempotencyKey: idempotencyKey ?? this.idempotencyKey,
      createdAt: createdAt ?? this.createdAt,
      failedRetryCount: failedRetryCount ?? this.failedRetryCount,
      retryCount: retryCount ?? this.retryCount,
      nextRetryAt: nextRetryAt ?? this.nextRetryAt,
      lastErrorCode: lastErrorCode ?? this.lastErrorCode,
      lastErrorAt: lastErrorAt ?? this.lastErrorAt,
      maxRetryReachedAt: maxRetryReachedAt ?? this.maxRetryReachedAt,
      localMeta: localMeta ?? this.localMeta,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (ownerUid.present) {
      map['owner_uid'] = Variable<String>(ownerUid.value);
    }
    if (actionType.present) {
      map['action_type'] = Variable<String>(actionType.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (idempotencyKey.present) {
      map['idempotency_key'] = Variable<String>(idempotencyKey.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<int>(createdAt.value);
    }
    if (failedRetryCount.present) {
      map['failed_retry_count'] = Variable<int>(failedRetryCount.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (nextRetryAt.present) {
      map['next_retry_at'] = Variable<int>(nextRetryAt.value);
    }
    if (lastErrorCode.present) {
      map['last_error_code'] = Variable<String>(lastErrorCode.value);
    }
    if (lastErrorAt.present) {
      map['last_error_at'] = Variable<int>(lastErrorAt.value);
    }
    if (maxRetryReachedAt.present) {
      map['max_retry_reached_at'] = Variable<int>(maxRetryReachedAt.value);
    }
    if (localMeta.present) {
      map['local_meta'] = Variable<String>(localMeta.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TripActionQueueTableCompanion(')
          ..write('id: $id, ')
          ..write('ownerUid: $ownerUid, ')
          ..write('actionType: $actionType, ')
          ..write('status: $status, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('idempotencyKey: $idempotencyKey, ')
          ..write('createdAt: $createdAt, ')
          ..write('failedRetryCount: $failedRetryCount, ')
          ..write('retryCount: $retryCount, ')
          ..write('nextRetryAt: $nextRetryAt, ')
          ..write('lastErrorCode: $lastErrorCode, ')
          ..write('lastErrorAt: $lastErrorAt, ')
          ..write('maxRetryReachedAt: $maxRetryReachedAt, ')
          ..write('localMeta: $localMeta')
          ..write(')'))
        .toString();
  }
}

class $LocalMetaTableTable extends LocalMetaTable
    with TableInfo<$LocalMetaTableTable, LocalMetaTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalMetaTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
      'key', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
      'value', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_meta';
  @override
  VerificationContext validateIntegrity(Insertable<LocalMetaTableData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
          _keyMeta, key.isAcceptableOrUnknown(data['key']!, _keyMeta));
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
          _valueMeta, value.isAcceptableOrUnknown(data['value']!, _valueMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  LocalMetaTableData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalMetaTableData(
      key: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}key'])!,
      value: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}value']),
    );
  }

  @override
  $LocalMetaTableTable createAlias(String alias) {
    return $LocalMetaTableTable(attachedDatabase, alias);
  }
}

class LocalMetaTableData extends DataClass
    implements Insertable<LocalMetaTableData> {
  final String key;
  final String? value;
  const LocalMetaTableData({required this.key, this.value});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    if (!nullToAbsent || value != null) {
      map['value'] = Variable<String>(value);
    }
    return map;
  }

  LocalMetaTableCompanion toCompanion(bool nullToAbsent) {
    return LocalMetaTableCompanion(
      key: Value(key),
      value:
          value == null && nullToAbsent ? const Value.absent() : Value(value),
    );
  }

  factory LocalMetaTableData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalMetaTableData(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String?>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String?>(value),
    };
  }

  LocalMetaTableData copyWith(
          {String? key, Value<String?> value = const Value.absent()}) =>
      LocalMetaTableData(
        key: key ?? this.key,
        value: value.present ? value.value : this.value,
      );
  LocalMetaTableData copyWithCompanion(LocalMetaTableCompanion data) {
    return LocalMetaTableData(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalMetaTableData(')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalMetaTableData &&
          other.key == this.key &&
          other.value == this.value);
}

class LocalMetaTableCompanion extends UpdateCompanion<LocalMetaTableData> {
  final Value<String> key;
  final Value<String?> value;
  final Value<int> rowid;
  const LocalMetaTableCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalMetaTableCompanion.insert({
    required String key,
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : key = Value(key);
  static Insertable<LocalMetaTableData> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalMetaTableCompanion copyWith(
      {Value<String>? key, Value<String?>? value, Value<int>? rowid}) {
    return LocalMetaTableCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalMetaTableCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$LocalDriftDatabase extends GeneratedDatabase {
  _$LocalDriftDatabase(QueryExecutor e) : super(e);
  $LocalDriftDatabaseManager get managers => $LocalDriftDatabaseManager(this);
  late final $LocationQueueTableTable locationQueueTable =
      $LocationQueueTableTable(this);
  late final $TripActionQueueTableTable tripActionQueueTable =
      $TripActionQueueTableTable(this);
  late final $LocalMetaTableTable localMetaTable = $LocalMetaTableTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [locationQueueTable, tripActionQueueTable, localMetaTable];
}

typedef $$LocationQueueTableTableCreateCompanionBuilder
    = LocationQueueTableCompanion Function({
  Value<int> id,
  required String ownerUid,
  required String routeId,
  Value<String?> tripId,
  required double lat,
  required double lng,
  Value<double?> speed,
  Value<double?> heading,
  required double accuracy,
  required int sampledAt,
  Value<int> createdAt,
  Value<int> retryCount,
  Value<int?> nextRetryAt,
});
typedef $$LocationQueueTableTableUpdateCompanionBuilder
    = LocationQueueTableCompanion Function({
  Value<int> id,
  Value<String> ownerUid,
  Value<String> routeId,
  Value<String?> tripId,
  Value<double> lat,
  Value<double> lng,
  Value<double?> speed,
  Value<double?> heading,
  Value<double> accuracy,
  Value<int> sampledAt,
  Value<int> createdAt,
  Value<int> retryCount,
  Value<int?> nextRetryAt,
});

class $$LocationQueueTableTableFilterComposer
    extends Composer<_$LocalDriftDatabase, $LocationQueueTableTable> {
  $$LocationQueueTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get ownerUid => $composableBuilder(
      column: $table.ownerUid, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get routeId => $composableBuilder(
      column: $table.routeId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tripId => $composableBuilder(
      column: $table.tripId, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get lat => $composableBuilder(
      column: $table.lat, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get lng => $composableBuilder(
      column: $table.lng, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get speed => $composableBuilder(
      column: $table.speed, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get heading => $composableBuilder(
      column: $table.heading, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get accuracy => $composableBuilder(
      column: $table.accuracy, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sampledAt => $composableBuilder(
      column: $table.sampledAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get nextRetryAt => $composableBuilder(
      column: $table.nextRetryAt, builder: (column) => ColumnFilters(column));
}

class $$LocationQueueTableTableOrderingComposer
    extends Composer<_$LocalDriftDatabase, $LocationQueueTableTable> {
  $$LocationQueueTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get ownerUid => $composableBuilder(
      column: $table.ownerUid, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get routeId => $composableBuilder(
      column: $table.routeId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tripId => $composableBuilder(
      column: $table.tripId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get lat => $composableBuilder(
      column: $table.lat, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get lng => $composableBuilder(
      column: $table.lng, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get speed => $composableBuilder(
      column: $table.speed, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get heading => $composableBuilder(
      column: $table.heading, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get accuracy => $composableBuilder(
      column: $table.accuracy, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sampledAt => $composableBuilder(
      column: $table.sampledAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get nextRetryAt => $composableBuilder(
      column: $table.nextRetryAt, builder: (column) => ColumnOrderings(column));
}

class $$LocationQueueTableTableAnnotationComposer
    extends Composer<_$LocalDriftDatabase, $LocationQueueTableTable> {
  $$LocationQueueTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get ownerUid =>
      $composableBuilder(column: $table.ownerUid, builder: (column) => column);

  GeneratedColumn<String> get routeId =>
      $composableBuilder(column: $table.routeId, builder: (column) => column);

  GeneratedColumn<String> get tripId =>
      $composableBuilder(column: $table.tripId, builder: (column) => column);

  GeneratedColumn<double> get lat =>
      $composableBuilder(column: $table.lat, builder: (column) => column);

  GeneratedColumn<double> get lng =>
      $composableBuilder(column: $table.lng, builder: (column) => column);

  GeneratedColumn<double> get speed =>
      $composableBuilder(column: $table.speed, builder: (column) => column);

  GeneratedColumn<double> get heading =>
      $composableBuilder(column: $table.heading, builder: (column) => column);

  GeneratedColumn<double> get accuracy =>
      $composableBuilder(column: $table.accuracy, builder: (column) => column);

  GeneratedColumn<int> get sampledAt =>
      $composableBuilder(column: $table.sampledAt, builder: (column) => column);

  GeneratedColumn<int> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => column);

  GeneratedColumn<int> get nextRetryAt => $composableBuilder(
      column: $table.nextRetryAt, builder: (column) => column);
}

class $$LocationQueueTableTableTableManager extends RootTableManager<
    _$LocalDriftDatabase,
    $LocationQueueTableTable,
    LocationQueueTableData,
    $$LocationQueueTableTableFilterComposer,
    $$LocationQueueTableTableOrderingComposer,
    $$LocationQueueTableTableAnnotationComposer,
    $$LocationQueueTableTableCreateCompanionBuilder,
    $$LocationQueueTableTableUpdateCompanionBuilder,
    (
      LocationQueueTableData,
      BaseReferences<_$LocalDriftDatabase, $LocationQueueTableTable,
          LocationQueueTableData>
    ),
    LocationQueueTableData,
    PrefetchHooks Function()> {
  $$LocationQueueTableTableTableManager(
      _$LocalDriftDatabase db, $LocationQueueTableTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocationQueueTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocationQueueTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocationQueueTableTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> ownerUid = const Value.absent(),
            Value<String> routeId = const Value.absent(),
            Value<String?> tripId = const Value.absent(),
            Value<double> lat = const Value.absent(),
            Value<double> lng = const Value.absent(),
            Value<double?> speed = const Value.absent(),
            Value<double?> heading = const Value.absent(),
            Value<double> accuracy = const Value.absent(),
            Value<int> sampledAt = const Value.absent(),
            Value<int> createdAt = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<int?> nextRetryAt = const Value.absent(),
          }) =>
              LocationQueueTableCompanion(
            id: id,
            ownerUid: ownerUid,
            routeId: routeId,
            tripId: tripId,
            lat: lat,
            lng: lng,
            speed: speed,
            heading: heading,
            accuracy: accuracy,
            sampledAt: sampledAt,
            createdAt: createdAt,
            retryCount: retryCount,
            nextRetryAt: nextRetryAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String ownerUid,
            required String routeId,
            Value<String?> tripId = const Value.absent(),
            required double lat,
            required double lng,
            Value<double?> speed = const Value.absent(),
            Value<double?> heading = const Value.absent(),
            required double accuracy,
            required int sampledAt,
            Value<int> createdAt = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<int?> nextRetryAt = const Value.absent(),
          }) =>
              LocationQueueTableCompanion.insert(
            id: id,
            ownerUid: ownerUid,
            routeId: routeId,
            tripId: tripId,
            lat: lat,
            lng: lng,
            speed: speed,
            heading: heading,
            accuracy: accuracy,
            sampledAt: sampledAt,
            createdAt: createdAt,
            retryCount: retryCount,
            nextRetryAt: nextRetryAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocationQueueTableTableProcessedTableManager = ProcessedTableManager<
    _$LocalDriftDatabase,
    $LocationQueueTableTable,
    LocationQueueTableData,
    $$LocationQueueTableTableFilterComposer,
    $$LocationQueueTableTableOrderingComposer,
    $$LocationQueueTableTableAnnotationComposer,
    $$LocationQueueTableTableCreateCompanionBuilder,
    $$LocationQueueTableTableUpdateCompanionBuilder,
    (
      LocationQueueTableData,
      BaseReferences<_$LocalDriftDatabase, $LocationQueueTableTable,
          LocationQueueTableData>
    ),
    LocationQueueTableData,
    PrefetchHooks Function()>;
typedef $$TripActionQueueTableTableCreateCompanionBuilder
    = TripActionQueueTableCompanion Function({
  Value<int> id,
  required String ownerUid,
  required String actionType,
  Value<String> status,
  required String payloadJson,
  required String idempotencyKey,
  Value<int> createdAt,
  Value<int> failedRetryCount,
  Value<int> retryCount,
  Value<int?> nextRetryAt,
  Value<String?> lastErrorCode,
  Value<int?> lastErrorAt,
  Value<int?> maxRetryReachedAt,
  Value<String?> localMeta,
});
typedef $$TripActionQueueTableTableUpdateCompanionBuilder
    = TripActionQueueTableCompanion Function({
  Value<int> id,
  Value<String> ownerUid,
  Value<String> actionType,
  Value<String> status,
  Value<String> payloadJson,
  Value<String> idempotencyKey,
  Value<int> createdAt,
  Value<int> failedRetryCount,
  Value<int> retryCount,
  Value<int?> nextRetryAt,
  Value<String?> lastErrorCode,
  Value<int?> lastErrorAt,
  Value<int?> maxRetryReachedAt,
  Value<String?> localMeta,
});

class $$TripActionQueueTableTableFilterComposer
    extends Composer<_$LocalDriftDatabase, $TripActionQueueTableTable> {
  $$TripActionQueueTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get ownerUid => $composableBuilder(
      column: $table.ownerUid, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get actionType => $composableBuilder(
      column: $table.actionType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get idempotencyKey => $composableBuilder(
      column: $table.idempotencyKey,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get failedRetryCount => $composableBuilder(
      column: $table.failedRetryCount,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get nextRetryAt => $composableBuilder(
      column: $table.nextRetryAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastErrorCode => $composableBuilder(
      column: $table.lastErrorCode, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get lastErrorAt => $composableBuilder(
      column: $table.lastErrorAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get maxRetryReachedAt => $composableBuilder(
      column: $table.maxRetryReachedAt,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get localMeta => $composableBuilder(
      column: $table.localMeta, builder: (column) => ColumnFilters(column));
}

class $$TripActionQueueTableTableOrderingComposer
    extends Composer<_$LocalDriftDatabase, $TripActionQueueTableTable> {
  $$TripActionQueueTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get ownerUid => $composableBuilder(
      column: $table.ownerUid, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get actionType => $composableBuilder(
      column: $table.actionType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get idempotencyKey => $composableBuilder(
      column: $table.idempotencyKey,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get failedRetryCount => $composableBuilder(
      column: $table.failedRetryCount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get nextRetryAt => $composableBuilder(
      column: $table.nextRetryAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastErrorCode => $composableBuilder(
      column: $table.lastErrorCode,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get lastErrorAt => $composableBuilder(
      column: $table.lastErrorAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get maxRetryReachedAt => $composableBuilder(
      column: $table.maxRetryReachedAt,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get localMeta => $composableBuilder(
      column: $table.localMeta, builder: (column) => ColumnOrderings(column));
}

class $$TripActionQueueTableTableAnnotationComposer
    extends Composer<_$LocalDriftDatabase, $TripActionQueueTableTable> {
  $$TripActionQueueTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get ownerUid =>
      $composableBuilder(column: $table.ownerUid, builder: (column) => column);

  GeneratedColumn<String> get actionType => $composableBuilder(
      column: $table.actionType, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<String> get idempotencyKey => $composableBuilder(
      column: $table.idempotencyKey, builder: (column) => column);

  GeneratedColumn<int> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<int> get failedRetryCount => $composableBuilder(
      column: $table.failedRetryCount, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => column);

  GeneratedColumn<int> get nextRetryAt => $composableBuilder(
      column: $table.nextRetryAt, builder: (column) => column);

  GeneratedColumn<String> get lastErrorCode => $composableBuilder(
      column: $table.lastErrorCode, builder: (column) => column);

  GeneratedColumn<int> get lastErrorAt => $composableBuilder(
      column: $table.lastErrorAt, builder: (column) => column);

  GeneratedColumn<int> get maxRetryReachedAt => $composableBuilder(
      column: $table.maxRetryReachedAt, builder: (column) => column);

  GeneratedColumn<String> get localMeta =>
      $composableBuilder(column: $table.localMeta, builder: (column) => column);
}

class $$TripActionQueueTableTableTableManager extends RootTableManager<
    _$LocalDriftDatabase,
    $TripActionQueueTableTable,
    TripActionQueueTableData,
    $$TripActionQueueTableTableFilterComposer,
    $$TripActionQueueTableTableOrderingComposer,
    $$TripActionQueueTableTableAnnotationComposer,
    $$TripActionQueueTableTableCreateCompanionBuilder,
    $$TripActionQueueTableTableUpdateCompanionBuilder,
    (
      TripActionQueueTableData,
      BaseReferences<_$LocalDriftDatabase, $TripActionQueueTableTable,
          TripActionQueueTableData>
    ),
    TripActionQueueTableData,
    PrefetchHooks Function()> {
  $$TripActionQueueTableTableTableManager(
      _$LocalDriftDatabase db, $TripActionQueueTableTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TripActionQueueTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TripActionQueueTableTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TripActionQueueTableTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> ownerUid = const Value.absent(),
            Value<String> actionType = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<String> idempotencyKey = const Value.absent(),
            Value<int> createdAt = const Value.absent(),
            Value<int> failedRetryCount = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<int?> nextRetryAt = const Value.absent(),
            Value<String?> lastErrorCode = const Value.absent(),
            Value<int?> lastErrorAt = const Value.absent(),
            Value<int?> maxRetryReachedAt = const Value.absent(),
            Value<String?> localMeta = const Value.absent(),
          }) =>
              TripActionQueueTableCompanion(
            id: id,
            ownerUid: ownerUid,
            actionType: actionType,
            status: status,
            payloadJson: payloadJson,
            idempotencyKey: idempotencyKey,
            createdAt: createdAt,
            failedRetryCount: failedRetryCount,
            retryCount: retryCount,
            nextRetryAt: nextRetryAt,
            lastErrorCode: lastErrorCode,
            lastErrorAt: lastErrorAt,
            maxRetryReachedAt: maxRetryReachedAt,
            localMeta: localMeta,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String ownerUid,
            required String actionType,
            Value<String> status = const Value.absent(),
            required String payloadJson,
            required String idempotencyKey,
            Value<int> createdAt = const Value.absent(),
            Value<int> failedRetryCount = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<int?> nextRetryAt = const Value.absent(),
            Value<String?> lastErrorCode = const Value.absent(),
            Value<int?> lastErrorAt = const Value.absent(),
            Value<int?> maxRetryReachedAt = const Value.absent(),
            Value<String?> localMeta = const Value.absent(),
          }) =>
              TripActionQueueTableCompanion.insert(
            id: id,
            ownerUid: ownerUid,
            actionType: actionType,
            status: status,
            payloadJson: payloadJson,
            idempotencyKey: idempotencyKey,
            createdAt: createdAt,
            failedRetryCount: failedRetryCount,
            retryCount: retryCount,
            nextRetryAt: nextRetryAt,
            lastErrorCode: lastErrorCode,
            lastErrorAt: lastErrorAt,
            maxRetryReachedAt: maxRetryReachedAt,
            localMeta: localMeta,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$TripActionQueueTableTableProcessedTableManager
    = ProcessedTableManager<
        _$LocalDriftDatabase,
        $TripActionQueueTableTable,
        TripActionQueueTableData,
        $$TripActionQueueTableTableFilterComposer,
        $$TripActionQueueTableTableOrderingComposer,
        $$TripActionQueueTableTableAnnotationComposer,
        $$TripActionQueueTableTableCreateCompanionBuilder,
        $$TripActionQueueTableTableUpdateCompanionBuilder,
        (
          TripActionQueueTableData,
          BaseReferences<_$LocalDriftDatabase, $TripActionQueueTableTable,
              TripActionQueueTableData>
        ),
        TripActionQueueTableData,
        PrefetchHooks Function()>;
typedef $$LocalMetaTableTableCreateCompanionBuilder = LocalMetaTableCompanion
    Function({
  required String key,
  Value<String?> value,
  Value<int> rowid,
});
typedef $$LocalMetaTableTableUpdateCompanionBuilder = LocalMetaTableCompanion
    Function({
  Value<String> key,
  Value<String?> value,
  Value<int> rowid,
});

class $$LocalMetaTableTableFilterComposer
    extends Composer<_$LocalDriftDatabase, $LocalMetaTableTable> {
  $$LocalMetaTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
      column: $table.key, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get value => $composableBuilder(
      column: $table.value, builder: (column) => ColumnFilters(column));
}

class $$LocalMetaTableTableOrderingComposer
    extends Composer<_$LocalDriftDatabase, $LocalMetaTableTable> {
  $$LocalMetaTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
      column: $table.key, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get value => $composableBuilder(
      column: $table.value, builder: (column) => ColumnOrderings(column));
}

class $$LocalMetaTableTableAnnotationComposer
    extends Composer<_$LocalDriftDatabase, $LocalMetaTableTable> {
  $$LocalMetaTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);
}

class $$LocalMetaTableTableTableManager extends RootTableManager<
    _$LocalDriftDatabase,
    $LocalMetaTableTable,
    LocalMetaTableData,
    $$LocalMetaTableTableFilterComposer,
    $$LocalMetaTableTableOrderingComposer,
    $$LocalMetaTableTableAnnotationComposer,
    $$LocalMetaTableTableCreateCompanionBuilder,
    $$LocalMetaTableTableUpdateCompanionBuilder,
    (
      LocalMetaTableData,
      BaseReferences<_$LocalDriftDatabase, $LocalMetaTableTable,
          LocalMetaTableData>
    ),
    LocalMetaTableData,
    PrefetchHooks Function()> {
  $$LocalMetaTableTableTableManager(
      _$LocalDriftDatabase db, $LocalMetaTableTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalMetaTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalMetaTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalMetaTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> key = const Value.absent(),
            Value<String?> value = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalMetaTableCompanion(
            key: key,
            value: value,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String key,
            Value<String?> value = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalMetaTableCompanion.insert(
            key: key,
            value: value,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalMetaTableTableProcessedTableManager = ProcessedTableManager<
    _$LocalDriftDatabase,
    $LocalMetaTableTable,
    LocalMetaTableData,
    $$LocalMetaTableTableFilterComposer,
    $$LocalMetaTableTableOrderingComposer,
    $$LocalMetaTableTableAnnotationComposer,
    $$LocalMetaTableTableCreateCompanionBuilder,
    $$LocalMetaTableTableUpdateCompanionBuilder,
    (
      LocalMetaTableData,
      BaseReferences<_$LocalDriftDatabase, $LocalMetaTableTable,
          LocalMetaTableData>
    ),
    LocalMetaTableData,
    PrefetchHooks Function()>;

class $LocalDriftDatabaseManager {
  final _$LocalDriftDatabase _db;
  $LocalDriftDatabaseManager(this._db);
  $$LocationQueueTableTableTableManager get locationQueueTable =>
      $$LocationQueueTableTableTableManager(_db, _db.locationQueueTable);
  $$TripActionQueueTableTableTableManager get tripActionQueueTable =>
      $$TripActionQueueTableTableTableManager(_db, _db.tripActionQueueTable);
  $$LocalMetaTableTableTableManager get localMetaTable =>
      $$LocalMetaTableTableTableManager(_db, _db.localMetaTable);
}
