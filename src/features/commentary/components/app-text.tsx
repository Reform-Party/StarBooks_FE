import { createContext, useContext } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { MAX_FONT_SCALE } from '@/features/commentary/constants/typography';

// 디자인 글꼴을 못 불러왔으면 false → 시스템 글꼴로라도 그려요.
export const FontsReadyContext = createContext(true);

// 독후 활동 화면의 모든 글자. 글자 크기 확대를 제한하고(고정 좌표 화면),
// 한국어는 단어 단위로 줄을 바꿔요(디자인 문서 04 keep-all, iOS).
export default function AppText({ style, ...rest }: TextProps) {
  const fontsReady = useContext(FontsReadyContext);
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      lineBreakStrategyIOS="hangul-word"
      {...rest}
      style={fontsReady ? style : [style, styles.system]}
    />
  );
}

const styles = StyleSheet.create({ system: { fontFamily: undefined } });
