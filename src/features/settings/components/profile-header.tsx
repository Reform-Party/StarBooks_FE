import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import GlassIconButton from '@/components/ui/glass-icon-button';
import JellyStar from '@/components/ui/jelly-star';
import { INK, STAR } from '@/constants/colors';
import { TYPE } from '@/constants/typography';

const AVATAR = 76;

type Props = {
  nickname: string;
  // 앨범에서 고른 사진. 없으면 기본 프로필(보라 구슬 + 노란 별)을 보여줘요.
  photoUri?: string | null;
  onPressChangePhoto: () => void;
};

// 설정 카드 위쪽: 프로필 사진 + 카메라 버튼 + "하늘 작가님"
export default function ProfileHeader({ nickname, photoUri, onPressChangePhoto }: Props) {
  const purple = STAR.purple;
  return (
    <View style={styles.header}>
      <View style={styles.avatar}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <>
            <Svg width={AVATAR} height={AVATAR}>
              <Defs>
                <RadialGradient
                  id="profile-avatar"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(28.88 21.28) scale(72.21)"
                >
                  <Stop offset="0" stopColor={purple.hi} />
                  <Stop offset="0.35" stopColor={purple.c300} />
                  <Stop offset="0.75" stopColor={purple.c500} />
                  <Stop offset="1" stopColor={purple.deep} />
                </RadialGradient>
              </Defs>
              <Circle cx={AVATAR / 2} cy={AVATAR / 2} r={AVATAR / 2} fill="url(#profile-avatar)" />
            </Svg>
            <View style={styles.star}>
              <JellyStar size={34.5} />
            </View>
          </>
        )}
        <GlassIconButton
          icon="camera"
          label="프로필 사진 바꾸기"
          size={28}
          fill="panel"
          onPress={onPressChangePhoto}
          style={styles.camera}
        />
      </View>
      <View style={styles.nameRow}>
        <Text style={[TYPE.title, styles.nickname]} numberOfLines={1}>
          {nickname}
        </Text>
        <Text style={[TYPE.body, styles.suffix]}>작가님</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 6 },
  avatar: { width: AVATAR, height: AVATAR },
  photo: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
  star: { position: 'absolute', left: 20.74, top: 19.4 },
  camera: { position: 'absolute', left: 50, top: 50 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  nickname: { color: INK[1], flexShrink: 1 },
  suffix: { color: INK[2] },
});
