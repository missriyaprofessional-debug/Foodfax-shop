import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants.dart';
import '../core/supabase_client.dart';

class StorageService {
  final SupabaseClient _client = SupabaseService.client;

  /// Upload file bytes to Supabase storage bucket
  Future<String?> uploadImage({
    required String bucketName,
    required String path,
    required Uint8List fileBytes,
    String contentType = 'image/jpeg',
  }) async {
    try {
      await _client.storage.from(bucketName).uploadBinary(
            path,
            fileBytes,
            fileOptions: FileOptions(contentType: contentType, upsert: true),
          );

      return _client.storage.from(bucketName).getPublicUrl(path);
    } catch (_) {
      return null;
    }
  }

  /// Upload shop logo or cover image
  Future<String?> uploadShopImage(String shopId, Uint8List bytes, String fileName) async {
    final path = 'shops/$shopId/$fileName';
    return uploadImage(
      bucketName: AppConstants.shopStorageBucket,
      path: path,
      fileBytes: bytes,
    );
  }

  /// Upload menu item image
  Future<String?> uploadMenuItemImage(String shopId, String itemId, Uint8List bytes) async {
    final path = 'menu/$shopId/$itemId.jpg';
    return uploadImage(
      bucketName: AppConstants.menuStorageBucket,
      path: path,
      fileBytes: bytes,
    );
  }
}
