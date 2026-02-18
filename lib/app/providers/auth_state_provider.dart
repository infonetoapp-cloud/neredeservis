import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final firebaseAuthStateProvider = StreamProvider<User?>((ref) {
  if (Firebase.apps.isEmpty) {
    return const Stream<User?>.empty();
  }
  return FirebaseAuth.instance.authStateChanges();
});

final isSignedInProvider = Provider<bool>((ref) {
  if (Firebase.apps.isEmpty) {
    return false;
  }
  final authState = ref.watch(firebaseAuthStateProvider);
  return authState.valueOrNull != null ||
      FirebaseAuth.instance.currentUser != null;
});
