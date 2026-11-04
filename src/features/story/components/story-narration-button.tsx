import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PAPER, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';

type Props = {
  uri: string | null;
  autoStart?: boolean;
  onFinished?: () => void;
};

export default function StoryNarrationButton(props: Props) {
  const [attempt, setAttempt] = useState(0);

  return (
    <NarrationControl key={attempt} {...props} onRetry={() => setAttempt((value) => value + 1)} />
  );
}

function NarrationControl({
  uri,
  autoStart = false,
  onFinished,
  onRetry,
}: Props & {
  onRetry: () => void;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [actionError, setActionError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!autoStart || !uri || !status.isLoaded) return;

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) player.play();
      })
      .catch(() => {
        if (!cancelled) setActionError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [autoStart, uri, status.isLoaded, player]);

  useEffect(() => {
    let handled = false;

    const subscription = player.addListener('playbackStatusUpdate', (next) => {
      if (next.playing) handled = false;

      if (next.didJustFinish && !handled) {
        handled = true;
        onFinished?.();
      }
    });

    return () => subscription.remove();
  }, [player, onFinished]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        player.pause();
      };
    }, [player]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') player.pause();
    });

    return () => subscription.remove();
  }, [player]);

  const failed = actionError || Boolean(status.error);
  const loading = Boolean(uri) && !failed && !status.isLoaded;
  const disabled = !uri || loading || busy;

  const togglePlayback = async () => {
    if (failed) {
      onRetry();
      return;
    }

    if (disabled) return;

    try {
      if (player.playing) {
        player.pause();
        return;
      }

      setBusy(true);

      if (Platform.OS !== 'web') {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
      }

      if (player.duration > 0 && player.currentTime >= player.duration - 0.05) {
        await player.seekTo(0);
      }

      player.play();
    } catch {
      setActionError(true);
    } finally {
      setBusy(false);
    }
  };

  const label = failed
    ? '음성 다시 불러오기'
    : !uri
      ? '이 쪽은 음성이 아직 없어요'
      : loading
        ? '음성 불러오는 중'
        : status.playing
          ? '읽어주기 일시정지'
          : '이 쪽 읽어주기';

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, busy: loading || busy }}
        disabled={disabled}
        onPress={() => void togglePlayback()}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text accessible={false} maxFontSizeMultiplier={1} style={styles.symbol}>
          {failed ? '↻' : loading || busy ? '…' : status.playing ? 'Ⅱ' : '▶'}
        </Text>
      </Pressable>

      {failed ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={1.2} style={styles.message}>
          음성을 재생하지 못했어요. ↻를 눌러 다시 불러와 주세요.
        </Text>
      ) : !uri ? (
        <Text maxFontSizeMultiplier={1.2} style={styles.message}>
          이 쪽은 음성이 아직 없어요.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: SCREEN.topBarY,
    left: SCREEN.homeButtonX - 52,
    zIndex: 2,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: STAR.yellow.c300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 20,
    color: PAPER.ink,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  message: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 230,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#191935',
    color: '#FFFFFF',
    fontFamily: FONT.sans,
    fontSize: 12,
    lineHeight: 18,
  },
});
