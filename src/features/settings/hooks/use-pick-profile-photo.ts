import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';

// picked: 사진을 골랐어요 / cancelled: 앨범을 그냥 닫았어요 / denied: 사진 권한이 없어요
export type PickPhotoResult =
  { status: 'picked'; uri: string } | { status: 'cancelled' | 'denied' };

// 프로필 사진 · 2 앨범에서 사진 고르기: 사진 권한 요청 → 앨범 → 정사각형으로 잘라서 골라요.
export function usePickProfilePhoto() {
  return useCallback(async (): Promise<PickPhotoResult> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      shape: 'oval',
      quality: 0.8,
    });
    const asset = result.canceled ? null : result.assets[0];
    return asset ? { status: 'picked', uri: asset.uri } : { status: 'cancelled' };
  }, []);
}
