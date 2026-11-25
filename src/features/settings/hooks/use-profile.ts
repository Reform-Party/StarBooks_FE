import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchProfile,
  updateProfile,
  uploadVoiceSample,
} from '@/features/settings/api/profile-api';
import type { Profile, ProfileUpdate } from '@/features/settings/api/types';
import { API_URL } from '@/lib/api-client';

const PROFILE_KEY = ['settings', 'profile'] as const;

// 마이페이지(닉네임 · 성별 · 나이)를 서버에서 불러와요.
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: ({ signal }) => fetchProfile(signal),
    enabled: Boolean(API_URL),
    retry: false,
  });
}

// 성별 · 나이를 고르면 바로 화면에 반영하고 서버에 저장해요. 실패하면 이전 값으로 돌려요.
export function useUpdateProfile({ onError }: { onError?: (error: Error) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    // 연달아 고르면 요청이 겹치지 않게 순서대로 보내요.
    scope: { id: 'settings-profile' },
    mutationFn: (next: ProfileUpdate) => updateProfile(next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEY });
      const previous = queryClient.getQueryData<Profile>(PROFILE_KEY);
      if (previous) queryClient.setQueryData<Profile>(PROFILE_KEY, { ...previous, ...next });
      return { previous };
    },
    onError: (error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(PROFILE_KEY, context.previous);
      onError?.(error);
    },
    onSuccess: (saved) => queryClient.setQueryData(PROFILE_KEY, saved),
  });
}

// 목소리 학습 요청. 녹음 화면에서 녹음 파일(.m4a) 경로를 넘겨요.
export function useUploadVoiceSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileUri: string) => uploadVoiceSample(fileUri),
    onSuccess: async () => {
      for (const key of ['story-narration-request', 'story-narration-result']) {
        await queryClient.cancelQueries({ queryKey: [key] });
        queryClient.removeQueries({ queryKey: [key] });
      }
    },
  });
}
