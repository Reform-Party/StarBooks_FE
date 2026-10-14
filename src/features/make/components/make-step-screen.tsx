import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import GlassIconButton from '@/components/ui/glass-icon-button';
import Icon from '@/components/ui/icon';
import JellyButton from '@/components/ui/jelly-button';
import Stage from '@/components/ui/stage';
import Toast from '@/components/ui/toast';
import { SCREEN } from '@/constants/layout';
import MakeHeader from '@/features/make/components/make-header';
import StarMap from '@/features/make/components/star-map';
import { MAKE_STEPS } from '@/features/make/constants/story-options';
import { useMakeStore } from '@/features/make/store/make-store';
import { useToast } from '@/hooks/use-toast';

// 단계 순서대로의 화면 주소 (교훈 → 주인공 → 배경 → 별자리 확인)
export const STEP_HREFS = ['/make/lesson', '/make/hero', '/make/background'] as const;

type Props = {
  stepIndex: number;
};

// 만들기 1 · 교훈 / 2 · 주인공 / 3 · 배경 (Figma design)
//  1 별 누름: 젤리 별로 채워지고 이름이 그 색으로 · 이전 선택 해제 · 위쪽 슬롯 갱신
//  2 고른 별을 다시 누름: 선택 해제 → 점선 별 · 슬롯 비움
//  3 다음: 안 골랐으면 넘어가지 않고 "○○ 별을 하나 골라 주세요" + 별 영역 흔들림
//  4 이전: 앞 단계(교훈은 메인) · 고른 값은 그대로
export default function MakeStepScreen({ stepIndex }: Props) {
  const step = MAKE_STEPS[stepIndex];
  const selection = useMakeStore((s) => s.selection);
  const select = useMakeStore((s) => s.select);
  const [shakeKey, setShakeKey] = useState(0);
  const { toast, show } = useToast();
  const selectedId = selection[step.key];

  // 앞 단계 · 메인으로는 쌓인 화면을 닫으며 돌아가고, 뒤 단계로는 새로 쌓아요.
  const goBackTo = (href: Href) => router.dismissTo(href);

  const handleJump = (i: number) => {
    if (i < stepIndex) goBackTo(STEP_HREFS[i]);
    else if (i > stepIndex) router.push(STEP_HREFS[i]);
  };

  const handleNext = () => {
    if (!selectedId) {
      show(step.missingMessage);
      setShakeKey((n) => n + 1);
      return;
    }
    router.push(stepIndex === STEP_HREFS.length - 1 ? '/make/confirm' : STEP_HREFS[stepIndex + 1]);
  };

  return (
    <Stage>
      <MakeHeader title={step.title} selection={selection} onJumpStep={handleJump} />
      <StarMap
        key={step.key}
        step={step}
        selectedId={selectedId}
        onToggle={(id) => select(step.key, id === selectedId ? null : id)}
        shakeKey={shakeKey}
      />
      <View style={styles.bottomNav} pointerEvents="box-none">
        <JellyButton
          tone="glass"
          label="이전"
          icon={<Icon name="chevronLeft" scale={0.8} />}
          height={36}
          onPress={() => goBackTo(stepIndex === 0 ? '/' : STEP_HREFS[stepIndex - 1])}
        />
        <JellyButton label="다음" height={36} onPress={handleNext} />
      </View>
      <GlassIconButton
        icon="home"
        label="메인으로"
        onPress={() => goBackTo('/')}
        style={styles.home}
      />
      <Toast toast={toast} top={300} />
    </Stage>
  );
}

const styles = StyleSheet.create({
  // 이전(왼쪽 끝 x 59) · 다음(오른쪽 끝 x 815) · y 349
  bottomNav: {
    position: 'absolute',
    left: SCREEN.safeX,
    right: SCREEN.safeX,
    top: 349,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  home: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
});
