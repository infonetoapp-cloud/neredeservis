import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('amber ui source is frozen to non-Material icons', () {
    final dartFiles = _dartFilesUnder('lib/ui');
    final materialIconPattern = RegExp(r'\bIcons\.');

    for (final file in dartFiles) {
      final content = file.readAsStringSync();
      expect(
        materialIconPattern.hasMatch(content),
        isFalse,
        reason: 'Material icon usage found in ${file.path}',
      );
    }
  });

  test('emoji usage is blocked in core UI/copy files', () {
    final files = <File>[
      ..._dartFilesUnder('lib/ui'),
      File('lib/features/subscription/presentation/paywall_copy_tr.dart'),
    ];

    final emojiPattern = RegExp(
      r'[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]',
      unicode: true,
    );

    for (final file in files) {
      final content = file.readAsStringSync();
      expect(
        emojiPattern.hasMatch(content),
        isFalse,
        reason: 'Emoji found in ${file.path}',
      );
    }
  });
}

List<File> _dartFilesUnder(String root) {
  return Directory(root)
      .listSync(recursive: true)
      .whereType<File>()
      .where((file) => file.path.endsWith('.dart'))
      .toList();
}
