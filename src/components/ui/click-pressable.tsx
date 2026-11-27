import { type GestureResponderEvent, Pressable, type PressableProps } from 'react-native';

import { playClick } from '@/features/sound/sound-players';

type Props = PressableProps;

// 누르면 버튼 효과음이 나는 Pressable. 배경 탭처럼 소리가 필요 없는 곳은 Pressable 을 그대로 써요.
export default function ClickPressable({ onPress, ...rest }: Props) {
  const handlePress = (e: GestureResponderEvent) => {
    onPress?.(e);
    playClick();
  };

  return <Pressable onPress={onPress ? handlePress : undefined} {...rest} />;
}
