import { useEffect, useRef, useState } from 'react';

import { MOTION } from '@/features/commentary/constants/motion';

export type Banner = { title?: string; sub?: string };

// 오답 배너. 내용과 표시 여부를 따로 둬서, 사라지는 동안에도 마지막 문구 그대로 사라져요.
export function useBanner(duration: number = MOTION.toast) {
  const [banner, setBanner] = useState<Banner>({});
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = (next: Banner) => {
    setBanner(next);
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), duration);
  };

  return { banner, visible, show };
}
