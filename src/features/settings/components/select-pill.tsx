import { useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import AppText from '@/components/ui/app-text';
import Icon from '@/components/ui/icon';
import PressableScale from '@/components/ui/pressable-scale';
import { GLASS, INK, PANEL } from '@/constants/colors';
import { RADIUS } from '@/constants/layout';
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
// 바깥 · 안드로이드 뒤로 가기 · VoiceOver 두 손가락 Z 로 닫혀요.
// 펼친 목록은 투명 Modal 레이어에 알약 위치를 재서 그려요. 부모 영역 밖에서도 안드로이드 스크롤이 되고,
// 조상의 zIndex · overflow 와 상관없이 맨 위에 떠요. 알약 위치를 재야 해서 열기는 알약 탭으로만 해요.
export default function SelectPill<T extends string | number>({
  label,
  value,
  options,
  onChange,
  width,
  open,
  onOpenChange,
}: Props<T>) {
  const rootRef = useRef<View>(null);
  // 알약의 화면 좌표. 열 때마다 다시 재요.
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const selected = options.find((option) => option.value === value);
  // 목록을 열 때 고른 값이 보이도록 스크롤할 위치 (값이 없으면 맨 위)
  const scrollIndex = Math.min(
    Math.max(0, options.indexOf(selected ?? options[0])),
    Math.max(0, options.length - MAX_ROWS),
  );

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(open ? '180deg' : '0deg', { duration: DURATION.menu }) }],
  }));

  const handleClose = () => onOpenChange(false);

  const handleToggle = () => {
    if (open) {
      handleClose();
      return;
    }
    rootRef.current?.measureInWindow((x, y) => {
      setAnchor({ x, y });
      onOpenChange(true);
    });
  };

  const handleSelect = (next: T) => {
    onOpenChange(false);
    if (next !== value) onChange(next);
  };

  return (
    <View ref={rootRef} style={[styles.root, { width }]}>
      <PressableScale
        width={width}
        height={HEIGHT}
        accessibilityLabel={selected ? `${label}, ${selected.label}` : label}
        accessibilityState={{ expanded: open }}
        onPress={handleToggle}
        style={styles.pill}
      >
        <AppText style={[TYPE.button, styles.value]} numberOfLines={1}>
          {selected?.label}
        </AppText>
        <Animated.View style={chevronStyle}>
          <Icon name="chevronDown" />
        </Animated.View>
      </PressableScale>
      <Modal
        transparent
        visible={open && anchor !== null}
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        navigationBarTranslucent
        supportedOrientations={['landscape-left', 'landscape-right', 'portrait']}
      >
        <Pressable accessible={false} onPress={handleClose} style={StyleSheet.absoluteFill} />
        {anchor ? (
          <Animated.View
            entering={FadeIn.duration(DURATION.menu)}
            exiting={FadeOut.duration(DURATION.menu)}
            onAccessibilityEscape={handleClose}
            style={[styles.menu, { left: anchor.x, top: anchor.y + HEIGHT + 6, width }]}
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
                    <AppText
                      style={[
                        TYPE.button,
                        isSelected ? styles.optionTextSelected : styles.optionText,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              }}
            />
          </Animated.View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: HEIGHT },
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
