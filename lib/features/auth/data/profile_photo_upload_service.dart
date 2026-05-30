import 'dart:typed_data';

import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';

import '../../backend/data/mobile_backend_api_client.dart';

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
    MobileBackendApiClient? apiClient,
    ImagePicker? imagePicker,
  })  : _apiClient = apiClient ?? MobileBackendApiClient(),
        _imagePicker = imagePicker ?? ImagePicker();

  static const int _maxDimension = 1024;
  static const int _maxBytes = 350 * 1024;
  static const List<int> _qualitySteps = <int>[84, 76, 68, 60, 52];

  final MobileBackendApiClient _apiClient;
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
    final response = await _apiClient.postBytes(
      '/api/auth/profile-photo',
      bodyBytes: compressedBytes,
      contentType: 'image/jpeg',
      queryParameters: <String, dynamic>{
        'role': role,
        if ((previousPhotoPath ?? '').trim().isNotEmpty)
          'previousPhotoPath': previousPhotoPath!.trim(),
      },
    );
    final downloadUrl = (response['downloadUrl'] as String?)?.trim();
    final storagePath = (response['storagePath'] as String?)?.trim();
    final bytesUploaded = response['bytesUploaded'] as int?;
    if (downloadUrl == null ||
        downloadUrl.isEmpty ||
        storagePath == null ||
        storagePath.isEmpty) {
      throw StateError('Profil fotografi yukleme yaniti gecersiz.');
    }

    return ProfilePhotoUploadResult(
      downloadUrl: downloadUrl,
      storagePath: storagePath,
      bytesUploaded: bytesUploaded ?? compressedBytes.lengthInBytes,
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
