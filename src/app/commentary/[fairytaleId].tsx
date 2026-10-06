import { router, useLocalSearchParams } from 'expo-router';

import CommentaryScreen from '@/features/commentary/components/commentary-screen';

export default function CommentaryRoute() {
  const { fairytaleId } = useLocalSearchParams<{ fairytaleId: string }>();
  return <CommentaryScreen fairytaleId={Number(fairytaleId)} onHome={() => router.back()} />;
}
