import { Text, type TextProps } from 'react-native';

// 고정 좌표 화면이라 기기 글자 크기를 이 배수까지만 따라가요 (그 이상은 토스트 · 버튼 · 트레이가 깨져요)
const MAX_FONT_SCALE = 1.2;

// 관계도 게임 화면의 글자. 글자 크기 확대를 제한하고, 한국어는 단어 단위로 줄을 바꿔요(Figma 04 keep-all, iOS).
export default function AppText(props: TextProps) {
  return (
    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} lineBreakStrategyIOS="hangul-word" {...props} />
  );
}
