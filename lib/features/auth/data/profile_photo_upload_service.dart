import 'dart:typed_data';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';

class ProfilePhotoUploadResult {
  const ProfilePhotoUploadResult({
    required this.downloadUrl,
    required this.storagePath,
    required this.bytesUploaded,
  });

  final String downloadUrl;
  final String storagePath;
  final int bytesUploaded;
}

class ProfilePhotoUploadService {
  ProfilePhotoUploadService({
    FirebaseStorage? storage,
    ImagePicker? imagePicker,
  })  : _storage = storage ?? FirebaseStorage.instance,
        _imagePicker = imagePicker ?? ImagePicker();

  static const int _maxDimension = 1024;
  static const int _maxBytes = 350 * 1024;
  static const List<int> _qualitySteps = <int>[84, 76, 68, 60, 52];

  final FirebaseStorage _storage;
  final ImagePicker _imagePicker;

  Future<ProfilePhotoUploadResult?> pickCompressAndUpload({
    required String uid,
    required String role,
    String? previousPhotoPath,
  }) async {
    final picked = await _imagePicker.pickImage(source: ImageSource.gallery);
    if (picked == null) {
      return null;
    }

    final compressedBytes = await _compressToTargetBytes(picked.path);
    final nowMs = DateTime.now().toUtc().millisecondsSinceEpoch;
    final storagePath = 'profile_photos/$uid/$nowMs.jpg';

    final ref = _storage.ref().child(storagePath);
    await ref.putData(
      compressedBytes,
      SettableMetadata(
        contentType: 'image/jpeg',
        cacheControl: 'public,max-age=86400',
        customMetadata: <String, String>{
          'uid': uid,
          'role': role,
        },
      ),
    );
    final downloadUrl = await ref.getDownloadURL();

    final stalePath = previousPhotoPath?.trim();
    if (stalePath != null &&
        stalePath.isNotEmpty &&
        stalePath != storagePath &&
        stalePath.startsWith('profile_photos/$uid/')) {
      try {
        await _storage.ref().child(stalePath).delete();
      } catch (_) {
        // Ignore stale asset cleanup errors.
      }
    }

    return ProfilePhotoUploadResult(
      downloadUrl: downloadUrl,
      storagePath: storagePath,
      bytesUploaded: compressedBytes.lengthInBytes,
    );
  }

  Future<Uint8List> _compressToTargetBytes(String sourcePath) async {
    Uint8List? fallback;
    for (final quality in _qualitySteps) {
      final compressed = await FlutterImageCompress.compressWithFile(
        sourcePath,
        quality: quality,
        minWidth: _maxDimension,
        minHeight: _maxDimension,
        format: CompressFormat.jpeg,
      );
      if (compressed == null || compressed.isEmpty) {
        continue;
      }
      final bytes = Uint8List.fromList(compressed);
      fallback = bytes;
      if (bytes.lengthInBytes <= _maxBytes) {
        return bytes;
      }
    }

    if (fallback != null) {
      return fallback;
    }
    throw StateError('Profil fotografi sikistirilamadi.');
  }
}
