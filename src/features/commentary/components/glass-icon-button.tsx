import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import Icon, { type IconName } from '@/features/commentary/components/icon';
import { GLASS } from '@/features/commentary/constants/theme';

type Props = {
  icon: IconName;
  label: string;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// 유리 아이콘 버튼 (⌀40). 44pt 보다 작으면 hitSlop 으로 누를 자리를 넓혀요.
export default function GlassIconButton({ icon, label, size = 40, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
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
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 6 },
  },
  pressed: { transform: [{ scale: 0.92 }] },
});
