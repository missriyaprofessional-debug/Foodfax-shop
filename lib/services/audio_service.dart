import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';

class AudioService {
  static final AudioService _instance = AudioService._internal();
  factory AudioService() => _instance;
  AudioService._internal();

  final AudioPlayer _player = AudioPlayer();
  bool _isSoundEnabled = true;

  bool get isSoundEnabled => _isSoundEnabled;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _isSoundEnabled = prefs.getBool(AppConstants.prefSoundEnabled) ?? true;
  }

  Future<void> setSoundEnabled(bool enabled) async {
    _isSoundEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.prefSoundEnabled, enabled);
  }

  /// Play incoming order chime
  Future<void> playNewOrderAlert() async {
    if (!_isSoundEnabled) return;
    try {
      await _player.stop();
      await _player.play(AssetSource('sounds/new_order_chime.mp3'));
    } catch (_) {
      // Audio fallback or web audio context
    }
  }

  void dispose() {
    _player.dispose();
  }
}
