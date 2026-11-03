import { StyleSheet, Text, View } from 'react-native';

import PressableScale from '@/components/ui/pressable-scale';
import { INK } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import SocialLogo, { type SocialProvider } from '@/features/auth/components/social-logo';

// 각 회사 가이드 색 · 로고 (카카오 노랑 · Google 흰색 · Apple 검정)
const PROVIDERS: { id: SocialProvider; name: string; bg: string; line: string }[] = [
  { id: 'kakao', name: '카카오', bg: '#FEE500', line: 'transparent' },
  { id: 'google', name: 'Google', bg: '#FFFFFF', line: 'transparent' },
  { id: 'apple', name: 'Apple', bg: '#000000', line: 'rgba(255,255,255,0.22)' },
];

const SIZE = 36;

type Props = {
  onPress: (name: string) => void;
};

// 간편 로그인 버튼 줄. 아직 연동 전이라 누르면 onPress 로 안내만 해요.
// Figma 에 없어서 ⌀40 아이콘 버튼 모양을 본떠 ⌀36 으로 만들었어요.
export default function SocialLoginRow({ onPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>간편 로그인</Text>
      {PROVIDERS.map((p) => (
        <PressableScale
          key={p.id}
          width={SIZE}
          height={SIZE}
          accessibilityLabel={`${p.name}로 로그인`}
          onPress={() => onPress(p.name)}
          style={[styles.button, { backgroundColor: p.bg, borderColor: p.line }]}
        >
          <SocialLogo provider={p.id} />
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: { marginRight: 2, fontFamily: FONT.sansSemi, fontSize: 13, color: INK[3] },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
