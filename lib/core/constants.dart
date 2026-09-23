class AppConstants {
  static const String appName = 'FoodFax Owner';
  static const String appTagline = 'Restaurant & Shop Partner App';

  // Supabase Configuration
  // Configured with owner project credentials
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project.supabase.co',
  );
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_O-f6YGUbj6hqHYBlwEhE5g_QVrnke9m',
  );

  // Storage Buckets
  static const String shopStorageBucket = 'shop-assets';
  static const String menuStorageBucket = 'menu-items';

  // Order Status Strings
  static const String statusPending = 'pending';
  static const String statusAccepted = 'accepted';
  static const String statusPreparing = 'preparing';
  static const String statusReady = 'ready';
  static const String statusCompleted = 'completed';
  static const String statusCancelled = 'cancelled';

  // Preferences Keys
  static const String prefSoundEnabled = 'sound_notification_enabled';
  static const String prefSoundVolume = 'sound_notification_volume';
  static const String prefHasOnboarded = 'has_completed_owner_onboarding';
}
