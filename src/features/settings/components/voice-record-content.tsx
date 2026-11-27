import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import AppText from '@/components/ui/app-text';
import GlassIconButton from '@/components/ui/glass-icon-button';
import { INK, STAR } from '@/constants/colors';
import { DURATION } from '@/constants/motion';
import { MAX_FONT_SCALE, TYPE } from '@/constants/typography';
import Nebula from '@/features/settings/components/nebula';
import { VOICE_SENTENCE_MS, VOICE_SENTENCES } from '@/features/settings/constants/voice-sentences';
import {
  NOISE_WARNING,
  SAVING_MESSAGE,
  useVoiceRecording,
} from '@/features/settings/hooks/use-voice-recording';
import { useBgmPause } from '@/features/sound/hooks/use-bgm-pause';

type Props = {
  onClose: () => void;
  onSaved: () => void;
  onDenied: () => void;
  onError: (message: string) => void;
};

// 목소리 등록 모달 안쪽. 모달이 열려 있는 동안만 마운트돼서, 녹음 · 상태 폴링 · 다시 그리기가 여기서 끝나요.
// 마운트되면 녹음을 시작하고, 닫혀서 언마운트되면 녹음을 버려요.
export default function VoiceRecordContent({ onClose, onSaved, onDenied, onError }: Props) {
  // 배경음악이 목소리 녹음에 섞이지 않게 모달이 열려 있는 동안 멈춰요.
  useBgmPause();
  const { status, level, elapsedMs } = useVoiceRecording({ onSaved, onDenied, onError });
  const warning = status === 'noisy' ? NOISE_WARNING : null;
  // 올리는 동안(최대 30초) 첫 문장으로 돌아가 처음 연 것처럼 보이지 않게 저장 중이라고 알려요.
  const sentence =
    status === 'saving'
      ? SAVING_MESSAGE
      : VOICE_SENTENCES[Math.floor(elapsedMs / VOICE_SENTENCE_MS) % VOICE_SENTENCES.length];

  // accessibilityLiveRegion 은 안드로이드에서만 읽어줘서, iOS 는 직접 알려줘요.
  useEffect(() => {
    if (Platform.OS === 'ios' && warning) AccessibilityInfo.announceForAccessibility(warning);
  }, [warning]);

  return (
    <>
      {/* 글꼴을 키워도 두 줄을 넘지 않아야 패널 344 안에 들어와요. */}
      <AppText
        style={[TYPE.heading, styles.title]}
        accessibilityRole="header"
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        누구의 목소리로 동화를 읽어볼까요?{'\n'}
        <AppText style={styles.mascot}>샛별이</AppText>가 기억할게요!
      </AppText>
      <Nebula mode={status === 'recording' ? 'live' : 'idle'} level={level} style={styles.nebula} />
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
    </>
  );
}

const styles = StyleSheet.create({
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
