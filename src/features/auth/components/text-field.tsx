import { type Ref, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GLASS, INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { TYPE } from '@/constants/typography';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  // 칸 아래 분홍 오류 문구
  error?: string;
  invalid?: boolean;
  // 값이 바뀔 때마다 좌우로 0.3s 흔들려요. (로그인 실패 횟수 등)
  shakeKey?: number;
  ref?: Ref<TextInput>;
};

const SHAKE = [-6, 6, -4, 3, 0];
const SHAKE_STEP_MS = 60;

// Figma 입력 · 선택 › 입력칸: 유리 · radius 14 · 포커스하면 노란 테두리
export default function TextField({
  label,
  error,
  invalid,
  shakeKey = 0,
  secureTextEntry,
  onFocus,
  onBlur,
  ref,
  ...input
}: Props) {
  const [focused, setFocused] = useState(false);
  const x = useSharedValue(0);

  useEffect(() => {
    if (shakeKey === 0) return;
    x.set(withSequence(...SHAKE.map((v) => withTiming(v, { duration: SHAKE_STEP_MS }))));
  }, [shakeKey, x]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const isInvalid = invalid || !!error;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={shakeStyle}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={`${INK[3]}73`}
          selectionColor={STAR.yellow.c300}
          secureTextEntry={secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            secureTextEntry && styles.password,
            focused && styles.focused,
            isInvalid && styles.invalid,
          ]}
          {...input}
        />
      </Animated.View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', gap: 6 },
  label: { ...TYPE.caption, fontFamily: FONT.sansSemi, color: INK[2] },
  input: {
    height: 40,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS.line,
    backgroundColor: GLASS.fill,
    fontFamily: FONT.pop,
    fontSize: 18,
    color: INK[1],
  },
  // ONE Mobile POP 에는 비밀번호 점(•) 글자가 없어서 Pretendard 로 그려요.
  password: { fontFamily: FONT.sans, letterSpacing: 2 },
  focused: {
    borderWidth: 1.5,
    borderColor: STAR.yellow.c300,
    shadowColor: STAR.yellow.c300,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  invalid: { borderWidth: 1.5, borderColor: STAR.pink.c500 },
  error: { fontFamily: FONT.sansSemi, fontSize: 13, color: STAR.pink.c300 },
});
