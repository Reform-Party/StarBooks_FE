// 별 중심 좌표: 왼쪽부터 지그재그로 연결해요.
export const STORY_POSITIONS = [
  { x: 158, y: 225 },
  { x: 350, y: 315 },
  { x: 385, y: 195 },
  { x: 550, y: 295 },
  { x: 620, y: 165 },
  { x: 742, y: 305 },
] as const;

export const STORIES_PAGE_SIZE = STORY_POSITIONS.length;
