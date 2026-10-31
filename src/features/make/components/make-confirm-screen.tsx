import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import AlertModal from '@/components/ui/alert-modal';
import GlassIconButton from '@/components/ui/glass-icon-button';
import JellyButton from '@/components/ui/jelly-button';
import Stage from '@/components/ui/stage';
import { INK } from '@/constants/colors';
import { SCREEN } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import Constellation from '@/features/make/components/constellation';
import { useSelectedStars } from '@/features/make/hooks/use-selected-stars';
import { missingSteps } from '@/features/make/constants/story-options';
import { useMakeStore } from '@/features/make/store/make-store';

type Props = {
  // 별자리가 완성된 뒤 "동화 만들기" 를 눌렀을 때
  onMake: () => void;
};

// 기본 · 별자리 확인 (Figma design)
//  진입: 세 별 수렴 → 충돌 → 별자리 생성 → 천천히 회전 / 2 동화 만들기 → 생성 요청 → 만드는 중
//  고르지 않은 별이 있으면 만들지 않고 빠진 항목을 알림창으로 알려요.
export default function MakeConfirmScreen({ onMake }: Props) {
  const selection = useMakeStore((s) => s.selection);
  const stars = useSelectedStars();
  const reduced = useReducedMotion();
  const [formed, setFormed] = useState(false);
  // 동작 줄이기면 별자리가 처음부터 완성돼 있어서 바로 보여 줘요.
  const showMake = formed || reduced;
  const missing = missingSteps(selection);
  const first = missing[0];

  return (
    <Stage>
      <Text accessibilityRole="header" style={[TYPE.heading, styles.title]}>
        나의 동화 별자리가 완성됐어요
      </Text>
      <Text style={[TYPE.body, styles.sub]}>세 개의 별이 하나의 이야기로 이어졌어요</Text>
      {first ? null : <Constellation stars={stars} onFormed={() => setFormed(true)} />}
      {showMake ? (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.action}>
          <JellyButton label="동화 만들기✦" width={162} onPress={onMake} />
        </Animated.View>
      ) : null}
      <GlassIconButton
        icon="home"
        label="메인으로"
        onPress={() => router.dismissTo('/')}
        style={styles.home}
      />
      <AlertModal
        visible={!!first}
        tone="pink"
        title="아직 고르지 않은 별이 있어요"
        message={`${missing.map((s) => s.starLabel).join(', ')} 별을 골라 주세요`}
        actionLabel={first ? `${first.starLabel} 고르러 가기` : '확인'}
        onAction={() => {
          if (first) router.dismissTo(first.href);
        }}
      />
    </Stage>
  );
}

const styles = StyleSheet.create({
  title: { position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center', color: INK[1] },
  sub: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: INK[1],
    fontSize: 17,
  },
  action: { position: 'absolute', top: 330, left: 0, right: 0, alignItems: 'center' },
  home: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
});
