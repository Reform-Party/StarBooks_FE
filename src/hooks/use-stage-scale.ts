import { createContext, useContext } from 'react';

// 캔버스가 몇 배로 그려졌는지. 배율이 바뀌면(회전 · 분할 화면) 손가락 좌표를 다시 재야 하는 화면에서 써요.
// Stage 가 Provider 로 값을 넣어요. 컴포넌트 파일(stage.tsx)에서 훅을 같이 내보내면 Fast Refresh 가
// 그 파일을 고칠 때마다 import 하는 화면까지 다시 실행해서, 따로 둬요.
export const StageScaleContext = createContext(1);
export const useStageScale = () => useContext(StageScaleContext);
