import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import AlertModal from '@/components/ui/alert-modal';
import GlassIconButton from '@/components/ui/glass-icon-button';
import Icon from '@/components/ui/icon';
import JellyButton from '@/components/ui/jelly-button';
import Panel from '@/components/ui/panel';
import Stage from '@/components/ui/stage';
import { STAR } from '@/constants/colors';
import { SCREEN } from '@/constants/layout';
import type { Gender, User } from '@/features/auth/api/types';
import ProfileHeader from '@/features/settings/components/profile-header';
import ProfilePhotoModal from '@/features/settings/components/profile-photo-modal';
import SelectPill, { type SelectOption } from '@/features/settings/components/select-pill';
import SoundToggle from '@/features/settings/components/sound-toggle';
import VoiceRecordModal from '@/features/settings/components/voice-record-modal';
import { usePickProfilePhoto } from '@/features/settings/hooks/use-pick-profile-photo';
import { useSettingsStore } from '@/features/settings/store/settings-store';

const GENDER_OPTIONS: readonly SelectOption<Gender>[] = [
  { label: '여자', value: 'W' },
  { label: '남자', value: 'M' },
];
const AGE_MIN = 1;
const AGE_MAX = 13;
// 목소리 등록 때 아이가 따라 읽을 문장 (Figma 목소리 등록 · 기본)
const VOICE_SENTENCE = '옛날 옛적에 꼬마 동화구연가가 살았어요.';

type Modal = 'photo' | 'voice' | 'photoDenied' | null;

type Props = {
  user: User;
  onSignOut: () => void;
};

// 기본 · 설정 (Figma design › ④ 설정): 프로필 · 성별 / 나이 · 목소리 등록 · 효과음 · 배경음악
// 고르면 바로 기기에 저장해요. (서버 저장은 API 가 생기면 연결)
export default function SettingsScreen({ user, onSignOut }: Props) {
  const profile = useSettingsStore((s) => s.profiles[user.id]);
  const sfx = useSettingsStore((s) => s.sfx);
  const bgm = useSettingsStore((s) => s.bgm);
  const setSfx = useSettingsStore((s) => s.setSfx);
  const setBgm = useSettingsStore((s) => s.setBgm);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const pickPhoto = usePickProfilePhoto();

  const [modal, setModal] = useState<Modal>(null);
  // 성별 · 나이 목록은 한 번에 하나만 펼쳐요.
  const [openSelect, setOpenSelect] = useState<'gender' | 'age' | null>(null);

  const gender = profile?.gender ?? user.gender;
  const age = profile?.age ?? user.age;
  const photoUri = profile?.photoUri ?? null;
  const ageOptions = ageOptionsWith(age);

  const handleDefaultPhoto = () => {
    updateProfile(user.id, { photoUri: null });
    setModal(null);
  };

  const handleAlbum = async () => {
    // 앨범이 모달 위로 떠요. 고르고 돌아오면 모달 없이 바뀐 사진을 보여줘요.
    setModal(null);
    const result = await pickPhoto();
    if (result.status === 'picked') updateProfile(user.id, { photoUri: result.uri });
    else if (result.status === 'denied') setModal('photoDenied');
  };

  return (
    <Stage>
      {/* 모달이 열린 동안 TalkBack 이 뒤 화면으로 가지 않게 숨겨요. (iOS 는 CenterModal 이 막아요) */}
      <View
        style={StyleSheet.absoluteFill}
        importantForAccessibility={modal ? 'no-hide-descendants' : 'auto'}
      >
        <Panel style={styles.panel}>
          <ProfileHeader
            nickname={user.nickname}
            photoUri={photoUri}
            onPressChangePhoto={() => setModal('photo')}
          />
          <View style={styles.selects}>
            <SelectPill
              label="성별"
              value={gender}
              options={GENDER_OPTIONS}
              onChange={(next) => updateProfile(user.id, { gender: next })}
              width={126}
              open={openSelect === 'gender'}
              onOpenChange={(open) => setOpenSelect(open ? 'gender' : null)}
            />
            <SelectPill
              label="나이"
              value={age}
              options={ageOptions}
              onChange={(next) => updateProfile(user.id, { age: next })}
              width={164}
              open={openSelect === 'age'}
              onOpenChange={(open) => setOpenSelect(open ? 'age' : null)}
            />
          </View>
          <JellyButton
            tone="mint"
            label="내 목소리 등록하기"
            icon={<Icon name="mic" color={STAR.mint.on} />}
            width={300}
            height={40}
            onPress={() => setModal('voice')}
            style={styles.voice}
          />
          <View style={styles.toggles}>
            <SoundToggle icon="volume" label="효과음" value={sfx} onChange={setSfx} />
            <SoundToggle icon="music" label="배경음악" value={bgm} onChange={setBgm} />
          </View>
        </Panel>
        {/* 디자인에 없는 임시 로그아웃. 계정 메뉴가 정해지면 옮겨요. */}
        <JellyButton
          tone="plain"
          label="로그아웃"
          height={40}
          onPress={onSignOut}
          style={styles.signOut}
        />
        <GlassIconButton
          icon="home"
          label="메인으로"
          onPress={() => router.dismissTo('/')}
          style={styles.home}
        />
      </View>

      <ProfilePhotoModal
        visible={modal === 'photo'}
        onClose={() => setModal(null)}
        onPressDefault={handleDefaultPhoto}
        onPressAlbum={handleAlbum}
      />
      {/* 녹음 · 소음 검사 · 자동 저장은 다음 작업에서 연결해요. 지금은 기본(idle) 상태만 보여줘요. */}
      <VoiceRecordModal
        visible={modal === 'voice'}
        onClose={() => setModal(null)}
        sentence={VOICE_SENTENCE}
        mode="idle"
      />
      <AlertModal
        visible={modal === 'photoDenied'}
        tone="pink"
        title="사진을 볼 수 없어요"
        message="기기 설정에서 사진 접근을 허용해 주세요"
        onAction={() => setModal(null)}
      />
    </Stage>
  );
}

// 가입 때 적은 나이가 범위 밖이어도 목록에서 고른 값이 보이게 넣어요.
function ageOptionsWith(current: number): SelectOption<number>[] {
  const ages = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);
  if (!ages.includes(current)) ages.push(current);
  return ages.sort((a, b) => a - b).map((value) => ({ label: `${value}살`, value }));
}

const styles = StyleSheet.create({
  // Figma 설정 카드: 262, 10 · 350 × 340
  panel: {
    position: 'absolute',
    left: 262,
    top: 10,
    width: 350,
    height: 340,
    alignItems: 'center',
    paddingTop: 17,
  },
  selects: { flexDirection: 'row', gap: 10, marginTop: 7 },
  voice: { marginTop: 11 },
  toggles: { flexDirection: 'row', gap: 42, marginTop: 11 },
  signOut: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.safeX },
  home: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
});
