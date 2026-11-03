import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api-client';

// 4xx 는 다시 보내도 같아서 바로 오류를 보여 주고, 그 밖의 실패만 두 번까지 다시 시도해요.
// 로그아웃할 때 비울 수 있게 앱 전체에서 하나만 써요.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, e) =>
        !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 2,
    },
  },
});
