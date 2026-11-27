import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastState = { message: string; id: number } | null;

// 잠깐 떴다 사라지는 안내. show(message) 로 띄우고, toast 를 <Toast> 에 넘겨요.
export function useToast(duration = 1800) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string) => {
      if (timer.current) clearTimeout(timer.current);
      setToast((prev) => ({ message, id: (prev?.id ?? 0) + 1 }));
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { toast, show };
}
