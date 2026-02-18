class UserModel {
  const UserModel({
    required this.uid,
    required this.role,
    required this.displayName,
    required this.phone,
    required this.email,
    required this.createdAt,
    required this.updatedAt,
    required this.deletedAt,
  });

  final String uid;
  final String role;
  final String displayName;
  final String? phone;
  final String? email;
  final String createdAt;
  final String updatedAt;
  final String? deletedAt;

  factory UserModel.fromMap(Map<String, dynamic> map, {required String uid}) {
    return UserModel(
      uid: uid,
      role: map['role'] as String? ?? '',
      displayName: map['displayName'] as String? ?? '',
      phone: map['phone'] as String?,
      email: map['email'] as String?,
      createdAt: map['createdAt'] as String? ?? '',
      updatedAt: map['updatedAt'] as String? ?? '',
      deletedAt: map['deletedAt'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'role': role,
      'displayName': displayName,
      'phone': phone,
      'email': email,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'deletedAt': deletedAt,
    };
  }
}
