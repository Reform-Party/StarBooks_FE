import { Text, type TextProps } from 'react-native';

import { MAX_FONT_SCALE } from '@/constants/typography';

type Props = TextProps;

// 시스템 글자 크기 확대를 MAX_FONT_SCALE 까지만 따르는 Text.
// 고정 높이 레이아웃 안의 글자는 react-native Text 대신 이걸 쓰세요.
export default function AppText({ maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: Props) {
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}
