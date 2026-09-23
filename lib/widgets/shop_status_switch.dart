import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ShopStatusSwitch extends StatelessWidget {
  final bool isOpen;
  final ValueChanged<bool> onChanged;

  const ShopStatusSwitch({
    super.key,
    required this.isOpen,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isOpen ? Colors.emerald.withOpacity(0.15) : Colors.red.withOpacity(0.15),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isOpen ? Colors.emerald.withOpacity(0.3) : Colors.red.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isOpen ? Colors.emerald : Colors.red,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            isOpen ? 'STORE OPEN' : 'STORE CLOSED',
            style: TextStyle(
              color: isOpen ? Colors.emerald : Colors.red,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(width: 6),
          Switch(
            value: isOpen,
            onChanged: onChanged,
            activeColor: Colors.emerald,
            activeTrackColor: Colors.emerald.withOpacity(0.3),
            inactiveThumbColor: Colors.red,
            inactiveTrackColor: Colors.red.withOpacity(0.3),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ],
      ),
    );
  }
}
