enum UserRole {
  driver,
  passenger,
  guest,
  unknown,
}

UserRole userRoleFromRaw(String? rawRole) {
  switch (rawRole?.toLowerCase()) {
    case 'driver':
      return UserRole.driver;
    case 'passenger':
      return UserRole.passenger;
    case 'guest':
      return UserRole.guest;
    default:
      return UserRole.unknown;
  }
}

extension UserRoleX on UserRole {
  bool get isDriver => this == UserRole.driver;

  bool get isPassenger => this == UserRole.passenger;

  bool get isGuest => this == UserRole.guest;
}
