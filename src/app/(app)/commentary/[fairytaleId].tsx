import { Redirect, router, useLocalSearchParams } from 'expo-router';

import CommentaryScreen from '@/features/commentary/components/commentary-screen';

// 딥링크로도 들어오는 값이라 양의 정수인지 확인하고, 아니면 메인으로 돌려보내요.
const toId = (raw: string | undefined) => (raw && /^\d+$/.test(raw) ? Number(raw) : null);

export default function CommentaryRoute() {
  const { fairytaleId } = useLocalSearchParams<{ fairytaleId: string }>();
  const id = toId(fairytaleId);
  if (id == null || id <= 0) return <Redirect href="/" />;
  // 메인에서 들어왔으면 그 메인으로 돌아가요 (replace 는 메인을 하나 더 쌓아요)
  return <CommentaryScreen fairytaleId={id} onHome={() => router.dismissTo('/')} />;
}
