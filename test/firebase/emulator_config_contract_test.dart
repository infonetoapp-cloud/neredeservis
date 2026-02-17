import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Firebase emulator config contract', () {
    test('firebase.json keeps required emulator targets enabled', () async {
      final file = File('firebase.json');
      expect(file.existsSync(), isTrue);

      final json = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
      final emulators = json['emulators'] as Map<String, dynamic>?;
      expect(emulators, isNotNull);

      expect((emulators?['auth'] as Map?)?['port'], 9099);
      expect((emulators?['functions'] as Map?)?['port'], 5001);
      expect((emulators?['firestore'] as Map?)?['port'], 8080);
      expect((emulators?['database'] as Map?)?['port'], 9000);
      expect((emulators?['hosting'] as Map?)?['port'], 5000);
      expect((emulators?['ui'] as Map?)?['enabled'], isTrue);
      expect((emulators?['ui'] as Map?)?['port'], 4000);
    });
  });
}
