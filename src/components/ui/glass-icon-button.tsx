import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import Icon, { type IconName } from '@/components/ui/icon';
import PressableScale from '@/components/ui/pressable-scale';
import { GLASS, PANEL } from '@/constants/colors';

type Props = {
  icon: IconName;
  // 스크린 리더가 읽는 이름 (예: "메인으로", "닫기")
  label: string;
  size?: number;
  // glass: 흰색 8% (메인 · 닫기) / panel: 남색 패널 (프로필 사진 위 카메라)
  fill?: 'glass' | 'panel';
  iconColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// 동그란 유리 아이콘 버튼 (Figma Icon Button · ⌀40 메인으로 · ⌀32 닫기 · ⌀28 프로필 사진 바꾸기)
export default function GlassIconButton({
  icon,
  label,
  size = 40,
  fill = 'glass',
  iconColor,
  onPress,
  style,
}: Props) {
  return (
    <PressableScale
      width={size}
      height={size}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        fill === 'panel' && styles.panel,
        style,
      ]}
    >
      <Icon name={icon} color={iconColor} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS.fill,
    borderWidth: 1,
    borderColor: GLASS.line,
  },
  panel: { backgroundColor: PANEL.fill },
});
