import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

type Props = { tone: 'yellow' | 'mint' | 'pink'; paused?: boolean };

export default function ConstellationLoading({ tone, paused = false }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // 빠른 응답에 로딩 문구가 번쩍이지 않게 해요. 데이터 표시는 지연하지 않아요.
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.status} accessibilityState={{ busy: true }}>
      {visible || paused ? (
        <>
          {!paused ? <ActivityIndicator color={STAR[tone].rim} /> : null}
          <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.2} style={styles.text}>
            {paused ? '인터넷 연결을 기다리고 있어요' : '동화를 불러오고 있어요'}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { position: 'absolute', top: 200, left: 100, right: 100, alignItems: 'center', gap: 12 },
  text: { fontFamily: FONT.sans, fontSize: 16, lineHeight: 24, color: INK[2], textAlign: 'center' },
});
