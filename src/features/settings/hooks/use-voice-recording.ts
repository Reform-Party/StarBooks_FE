import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { useUploadVoiceSample } from '@/features/settings/hooks/use-profile';

// Figma 목소리 등록: 약 1분 뒤 자동 저장 → 모달 닫힘. 말을 시작한 때가 아니라 녹음을 시작한 때부터 재요.
const RECORD_MS = 60_000;
// Figma: 녹음 시작 0~0.25초에 소음 검사
const NOISE_CHECK_MS = 250;
// 소음으로 보는 크기(dBFS, 0 이 가장 큼). Figma 의 "30dB 초과"를 기기 입력 크기로 옮긴 값이라 실기기에서 맞춰야 해요.
const NOISE_DBFS = -30;
// 이보다 작으면 조용한 것으로 보고 성운이 쉬어요. 이 사이를 0–1 로 펴서 성운에 넘겨요.
const SILENCE_DBFS = -50;
const METER_INTERVAL_MS = 50;

export const NOISE_WARNING = '조용한 곳으로 이동해주세요.';
export const SAVING_MESSAGE = '목소리를 저장하고 있어요';

// idle: 녹음 전 · 취소 / recording: 녹음 중 / noisy: 소음 때문에 멈춤 / saving: 올리는 중
export type VoiceRecordingStatus = 'idle' | 'recording' | 'noisy' | 'saving';

type Options = {
  onSaved: () => void;
  onDenied: () => void;
  onError: (message: string) => void;
};

// 목소리 등록 녹음: 권한 → 녹음(.m4a) → 소음 검사 → 1분 뒤 자동 업로드.
// 마운트되면 바로 녹음을 시작하고, 언마운트되면 녹음을 버려요. 모달이 열려 있는 동안만 마운트해 주세요.
// (useAudioRecorderState 가 50ms 마다 녹음기 상태를 읽어서, 쓰는 컴포넌트가 계속 다시 그려져요)
// level 은 지금 목소리 크기(0–1)라 성운 live 모드에 그대로 넘겨요. elapsedMs 는 녹음한 시간이에요.
export function useVoiceRecording({ onSaved, onDenied, onError }: Options) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, METER_INTERVAL_MS);
  const upload = useUploadVoiceSample();
  const level = useSharedValue(0);
  const [status, setStatus] = useState<VoiceRecordingStatus>('idle');
  // 녹음을 시작할 때마다 올려요. 취소된 녹음의 타이머 · 업로드 결과는 번호가 달라 무시해요.
  const session = useRef(0);
  const noisePeak = useRef(-160);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // 녹음 중인 목소리 크기를 성운과 소음 검사에 넘겨요.
  useEffect(() => {
    const db = recorderState.metering;
    if (!recorderState.isRecording || db == null) {
      level.set(0);
      return;
    }
    noisePeak.current = Math.max(noisePeak.current, db);
    level.set(Math.min(1, Math.max(0, (db - SILENCE_DBFS) / -SILENCE_DBFS)));
  }, [recorderState.isRecording, recorderState.metering, level]);

  // 녹음기가 먼저 정리돼 getStatus 가 실패해도 녹음용 오디오 모드는 꼭 꺼요.
  const stopRecorder = async () => {
    try {
      if (recorder.getStatus().isRecording) await recorder.stop();
    } finally {
      await setAudioModeAsync({ allowsRecording: false });
    }
  };

  const finish = async (id: number) => {
    if (id !== session.current) return;
    clearTimers();
    setStatus('saving');
    try {
      await stopRecorder();
      const uri = recorder.uri;
      if (!uri) throw new Error('녹음 파일을 찾지 못했어요. 다시 녹음해 주세요');
      await upload.mutateAsync(uri);
      if (id !== session.current) return;
      setStatus('idle');
      onSaved();
    } catch (e) {
      if (id !== session.current) return;
      setStatus('idle');
      onError(e instanceof Error ? e.message : '목소리를 등록하지 못했어요');
    }
  };

  const start = async () => {
    session.current += 1;
    const id = session.current;
    clearTimers();
    noisePeak.current = -160;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (id !== session.current) return;
      if (!granted) {
        onDenied();
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (id !== session.current) return;
      recorder.record();
      setStatus('recording');
      timers.current.push(
        setTimeout(() => {
          if (id !== session.current || noisePeak.current <= NOISE_DBFS) return;
          // 시끄러우면 바로 멈추고 경고를 보여줘요. 성운은 쉬는 모양으로 돌아가요.
          clearTimers();
          setStatus('noisy');
          stopRecorder().catch(() => undefined);
        }, NOISE_CHECK_MS),
        setTimeout(() => void finish(id), RECORD_MS),
      );
    } catch {
      if (id !== session.current) return;
      setStatus('idle');
      onError('마이크를 켜지 못했어요. 다시 시도해 주세요');
    }
  };

  // 닫기 · 뒤로 가기 · 화면 이탈: 녹음을 버려요. 올리는 중이면 결과를 무시해요.
  const cancel = () => {
    session.current += 1;
    clearTimers();
    stopRecorder().catch(() => undefined);
  };

  // 모달이 열리면 바로 녹음을 시작해요. (Figma: 1 auto 녹음 시작 · 소음 검사)
  // 다음 틱에 시작해서, 마운트 직후 바로 언마운트되면(개발 모드 StrictMode 등) 녹음을 켜지 않아요.
  const onMount = useEffectEvent(() => void start());
  const onUnmount = useEffectEvent(cancel);
  useEffect(() => {
    const timer = setTimeout(onMount, 0);
    return () => {
      clearTimeout(timer);
      onUnmount();
    };
  }, []);

  const elapsedMs = status === 'recording' ? recorderState.durationMillis : 0;

  return { status, level, elapsedMs };
}
