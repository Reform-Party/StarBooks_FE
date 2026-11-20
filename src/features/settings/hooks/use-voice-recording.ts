import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { useUploadVoiceSample } from '@/features/settings/hooks/use-profile';

// Figma 목소리 등록: 약 1분 뒤 자동 저장 → 모달 닫힘
const RECORD_MS = 60_000;
// Figma: 녹음 시작 0~0.25초에 소음 검사
const NOISE_CHECK_MS = 250;
// 소음으로 보는 크기(dBFS, 0 이 가장 큼). Figma 의 "30dB 초과"를 기기 입력 크기로 옮긴 값이라 실기기에서 맞춰야 해요.
const NOISE_DBFS = -30;
// 이보다 작으면 조용한 것으로 보고 성운이 쉬어요. 이 사이를 0–1 로 펴서 성운에 넘겨요.
const SILENCE_DBFS = -50;
const METER_INTERVAL_MS = 50;

export const NOISE_WARNING = '조용한 곳으로 이동해주세요.';

// idle: 녹음 전 · 취소 / recording: 녹음 중 / noisy: 소음 때문에 멈춤 / saving: 올리는 중
export type VoiceRecordingStatus = 'idle' | 'recording' | 'noisy' | 'saving';

type Options = {
  onSaved: () => void;
  onDenied: () => void;
  onError: (message: string) => void;
};

// 목소리 등록 녹음: 권한 → 녹음(.m4a) → 소음 검사 → 1분 뒤 자동 업로드.
// level 은 지금 목소리 크기(0–1)라 성운 live 모드에 그대로 넘겨요.
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

  // 화면을 떠나면 타이머를 멈춰요. (녹음기는 useAudioRecorder 가 정리해요)
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const stopRecorder = async () => {
    if (recorder.getStatus().isRecording) await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
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
    setStatus('idle');
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

  // 닫기 · 뒤로 가기: 녹음을 버려요. 올리는 중이면 결과를 무시해요.
  const cancel = () => {
    session.current += 1;
    clearTimers();
    setStatus('idle');
    stopRecorder().catch(() => undefined);
  };

  return { status, level, start, cancel };
}
