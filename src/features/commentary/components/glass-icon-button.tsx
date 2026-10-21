import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import Icon, { type IconName } from '@/features/commentary/components/icon';
import { GLASS } from '@/features/commentary/constants/theme';

type Props = {
  icon: IconName;
  label: string;
  size?: number;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// 유리 아이콘 버튼 (⌀40). 44pt 보다 작으면 hitSlop 으로 누를 자리를 넓혀요.
export default function GlassIconButton({
  icon,
  label,
  size = 40,
  onPress,
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.45)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS.fill,
    borderWidth: 1,
    borderColor: GLASS.line,
    boxShadow: '0px 6px 14px rgba(0,0,0,0.35)',
  },
  pressed: { transform: [{ scale: 0.92 }] },
  disabled: { opacity: 0.4 },
});
