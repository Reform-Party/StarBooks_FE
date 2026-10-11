import { useEffect } from 'react';
import { BackHandler, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import Icon from '@/components/ui/icon';
import PressableScale from '@/components/ui/pressable-scale';
import { GLASS, INK, PANEL } from '@/constants/colors';
import { RADIUS, SCREEN } from '@/constants/layout';
import { DURATION } from '@/constants/motion';
import { TYPE } from '@/constants/typography';

const HEIGHT = 40;
const ROW = 40;
const MAX_ROWS = 4;
const MENU_PADDING = 4;
const MENU_BORDER = 1;

export type SelectOption<T extends string | number> = { label: string; value: T };

type Props<T extends string | number> = {
  // 스크린 리더가 읽는 이름 (예: "성별", "나이")
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  width: number;
  // 한 번에 하나만 열리도록 부모가 열림 상태를 관리해요.
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 성별 · 나이 고르기 (Figma Button/Glass 여자 · 7살). 누르면 목록이 펼쳐지고, 고르면 바로 저장해요.
// 바깥을 누르거나 안드로이드 뒤로 가기를 누르면 닫혀요.
// 펼친 목록은 아래 형제 위로 겹쳐 그려지므로, 이 컴포넌트를 감싼 줄에 zIndex 를 주세요.
// 바깥 터치를 받는 막과 목록이 부모 영역 밖으로 나가므로, 조상에는 overflow: 'hidden' · ScrollView 를 쓰지 마세요.
export default function SelectPill<T extends string | number>({
  label,
  value,
  options,
  onChange,
  width,
  open,
  onOpenChange,
}: Props<T>) {
  const selected = options.find((option) => option.value === value);
  // 목록을 열 때 고른 값이 보이도록 스크롤할 위치 (값이 없으면 맨 위)
  const scrollIndex = Math.min(
    Math.max(0, options.indexOf(selected ?? options[0])),
    Math.max(0, options.length - MAX_ROWS),
  );

  useEffect(() => {
    if (!open) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onOpenChange(false);
      return true;
    });
    return () => sub.remove();
  }, [open, onOpenChange]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(open ? '180deg' : '0deg', { duration: DURATION.menu }) }],
  }));

  const handleSelect = (next: T) => {
    onOpenChange(false);
    if (next !== value) onChange(next);
  };

  return (
    <View style={[styles.root, { width }, open && styles.rootOpen]}>
      {open ? (
        <Pressable accessible={false} onPress={() => onOpenChange(false)} style={styles.backdrop} />
      ) : null}
      <PressableScale
        width={width}
        height={HEIGHT}
        accessibilityLabel={`${label}, ${selected?.label ?? ''}`}
        accessibilityState={{ expanded: open }}
        onPress={() => onOpenChange(!open)}
        style={styles.pill}
      >
        <Text style={[TYPE.button, styles.value]} numberOfLines={1}>
          {selected?.label}
        </Text>
        <Animated.View style={chevronStyle}>
          <Icon name="chevronDown" />
        </Animated.View>
      </PressableScale>
      {open ? (
        <Animated.View
          entering={FadeIn.duration(DURATION.menu)}
          exiting={FadeOut.duration(DURATION.menu)}
          style={styles.menu}
        >
          <FlatList
            data={options}
            keyExtractor={(option) => String(option.value)}
            getItemLayout={(_, index) => ({ length: ROW, offset: ROW * index, index })}
            initialScrollIndex={scrollIndex}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelect(item.value)}
                  style={[styles.option, isSelected && styles.optionSelected]}
                >
                  <Text
                    style={[
                      TYPE.button,
                      isSelected ? styles.optionTextSelected : styles.optionText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: HEIGHT },
  rootOpen: { zIndex: 10 },
  // 화면 어디를 눌러도 닫히도록 874 × 402 화면보다 넓게 깔아요.
  backdrop: {
    position: 'absolute',
    left: -SCREEN.width,
    top: -SCREEN.height,
    width: SCREEN.width * 3,
    height: SCREEN.height * 3,
  },
  pill: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 17,
    borderRadius: RADIUS.pill,
    backgroundColor: GLASS.fill,
    borderWidth: 1,
    borderColor: GLASS.line,
  },
  value: { flex: 1, color: INK[1] },
  menu: {
    position: 'absolute',
    top: HEIGHT + 6,
    left: 0,
    right: 0,
    maxHeight: ROW * MAX_ROWS + (MENU_PADDING + MENU_BORDER) * 2,
    padding: MENU_PADDING,
    borderRadius: RADIUS.card,
    backgroundColor: PANEL.solid,
    borderWidth: MENU_BORDER,
    borderColor: GLASS.line,
  },
  option: {
    height: ROW,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: RADIUS.chip,
  },
  optionSelected: { backgroundColor: GLASS.fill },
  optionText: { color: INK[2] },
  optionTextSelected: { color: INK[1] },
});
