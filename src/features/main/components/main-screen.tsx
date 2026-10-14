import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import BrandTitle from '@/components/ui/brand-title';
import GlassIconButton from '@/components/ui/glass-icon-button';
import Stage from '@/components/ui/stage';
import Toast from '@/components/ui/toast';
import type { StarColor } from '@/constants/colors';
import { SCREEN } from '@/constants/layout';
import FloatingStarButton from '@/features/main/components/floating-star-button';
import { useToast } from '@/hooks/use-toast';

type MenuItem = { label: string; tone: StarColor; reverse?: boolean; onPress: () => void };

type Props = {
  // 동화 만들기를 새로 시작할 때 (이전 선택 · 생성 상태를 비우고 1단계로)
  onStartMake: () => void;
};

// 기본 · 메인 (Figma design): ✦별나라 책방✦ 제목 + 둥실 떠 있는 젤리 별 3개
//  2 동화 만들기 → 1 · 교훈 / 3 동화 여행 · 4 동화 책장 (② 솔 파트) / 5 설정 (④ 준석 파트)
export default function MainScreen({ onStartMake }: Props) {
  const { toast, show } = useToast();
  const comingSoon = () => show('곧 열려요. 조금만 기다려 주세요');

  const menu: MenuItem[] = [
    { label: '동화 만들기', tone: 'yellow', onPress: onStartMake },
    { label: '동화 여행', tone: 'mint', reverse: true, onPress: comingSoon },
    { label: '동화 책장', tone: 'mint', onPress: comingSoon },
  ];

  return (
    <Stage>
      <View style={styles.title}>
        <BrandTitle size={44} />
      </View>
      <View style={styles.menu}>
        {menu.map((m) => (
          <FloatingStarButton key={m.label} {...m} />
        ))}
      </View>
      <GlassIconButton
        icon="settings"
        label="설정"
        onPress={() => router.push('/settings')}
        style={styles.settings}
      />
      <Toast toast={toast} top={340} />
    </Stage>
  );
}

const styles = StyleSheet.create({
  title: { position: 'absolute', top: 26, left: 0, right: 0, alignItems: 'center' },
  menu: {
    position: 'absolute',
    top: 132,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 76,
  },
  settings: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
});
