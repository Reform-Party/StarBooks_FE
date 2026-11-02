import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, type SharedValue } from 'react-native-reanimated';

import AppText from '@/components/ui/app-text';
import CenterModal from '@/components/ui/center-modal';
import GlassIconButton from '@/components/ui/glass-icon-button';
import { INK, STAR } from '@/constants/colors';
import { DURATION } from '@/constants/motion';
import { MAX_FONT_SCALE, TYPE } from '@/constants/typography';
import Nebula, { type NebulaMode } from '@/features/settings/components/nebula';

type Props = {
  visible: boolean;
  onClose: () => void; // 녹음 취소 · 모달 닫힘
  // 아이가 따라 읽을 문장
  sentence: string;
  mode: NebulaMode;
  // live 모드에서 성운이 반응할 목소리 크기 0–1
  level?: SharedValue<number>;
  // 소음 때문에 녹음을 멈췄을 때 문장 자리에 보여줄 안내 (예: "조용한 곳으로 이동해주세요.")
  warning?: string | null;
};

// 목소리 등록 모달 (Figma 목소리 등록 · 480 × 344)
export default function VoiceRecordModal({
  visible,
  onClose,
  sentence,
  mode,
  level,
  warning,
}: Props) {
  // accessibilityLiveRegion 은 안드로이드에서만 읽어줘서, iOS 는 직접 알려줘요.
  useEffect(() => {
    if (Platform.OS === 'ios' && visible && warning) {
      AccessibilityInfo.announceForAccessibility(warning);
    }
  }, [visible, warning]);

  return (
    // 아이가 기기를 잡다가 패널 밖을 건드려도 녹음이 취소되지 않게, 닫기 버튼 · 뒤로 가기로만 닫아요.
    <CenterModal
      visible={visible}
      onRequestClose={onClose}
      dismissOnScrimPress={false}
      panelStyle={styles.panel}
    >
      <AppText style={[TYPE.heading, styles.title]} accessibilityRole="header">
        누구의 목소리로 동화를 읽어볼까요?{'\n'}
        <AppText style={styles.mascot}>샛별이</AppText>가 기억할게요!
      </AppText>
      <Nebula mode={mode} level={level} style={styles.nebula} />
      <View style={styles.line} accessibilityLiveRegion="polite">
        {warning ? (
          <Animated.Text
            key="warning"
            entering={FadeIn.duration(DURATION.menu)}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[TYPE.bodyL, styles.lineText, styles.warning]}
          >
            {warning}
          </Animated.Text>
        ) : (
          <AppText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[TYPE.bodyL, styles.lineText, styles.sentence]}
          >
            {sentence}
          </AppText>
        )}
      </View>
      {/* 다른 요소보다 위에 그려지도록 마지막에 둬요. */}
      <GlassIconButton icon="x" label="닫기" size={32} onPress={onClose} style={styles.close} />
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: { width: 480, height: 344, alignItems: 'center', paddingTop: 16 },
  close: { position: 'absolute', top: 13, right: 11 },
  title: { color: INK[1], textAlign: 'center', lineHeight: 32.5 },
  mascot: { color: STAR.yellow.rim },
  nebula: { marginTop: 6 },
  // 글꼴 확대 때 lineHeight 도 같이 커져서 높이는 최소값만 둬요. (MAX_FONT_SCALE 1.2배에서 패널 344 안에 들어와요)
  line: { marginTop: 16, minHeight: 25, maxWidth: 440, justifyContent: 'center' },
  lineText: { lineHeight: 25, textAlign: 'center' },
  sentence: { color: INK[1] },
  warning: { color: STAR.pink.rim },
});
