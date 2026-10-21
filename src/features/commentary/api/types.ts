// 관계도 게임 API 타입 (Notion「API 명세서 › 관계도」기준)

export type Category = '등장인물' | '장소' | '사건' | '교훈';

export type CharSpecies = 'HUMAN' | 'ANIMAL' | 'ETC';

export type Background =
  | 'KOREAN_TRADITIONAL'
  | 'FOREST_NATURE'
  | 'MIXED'
  | 'FANTASY_WORLD'
  | 'EUROPEAN_MEDIEVAL'
  | 'MODERN_FANTASY'
  | 'UNDERWATER'
  | 'SKY_HEAVEN';

export type GameNode = { id: number; word: string; category: Category };

// edgeId 가 없으면(응답 누락) 3단계에서 그 선은 눌러도 설명을 부르지 않아요
export type GraphEdge = { edgeId?: number; from: number; to: number };

export type GameGraph = { nodes: GameNode[]; edges: GraphEdge[] };

// POST /api/game/start
export type GameStartData = {
  sessionId: string;
  stage: 'CLASSIFY';
  selectedCharSpecies: CharSpecies;
  selectedBackground: Background;
  question: { nodes: GameNode[]; categories: Category[] };
};

// POST /api/game/classify
export type ClassifyData = {
  correct: boolean;
  stageComplete: boolean;
  hint?: string;
  nextStage?: 'ASSEMBLE';
  // 아래는 stageComplete=true 일 때만 와요
  selectedCharSpecies?: CharSpecies;
  selectedBackground?: Background;
  question?: { nodes: GameNode[]; totalEdges: number };
};

// POST /api/game/quiz
export type QuizChoice = { choiceId: number; content: string };
export type QuizData = { quizId: string; question: string; choices: QuizChoice[] };

// POST /api/game/quiz/answer
export type QuizAnswerData = {
  correct: boolean;
  stageComplete: boolean;
  description?: string;
  hint?: string;
  // 아래는 stageComplete=true 일 때만 와요
  selectedCharSpecies?: CharSpecies;
  selectedBackground?: Background;
  graph?: GameGraph;
};

// GET /api/game/edge
export type EdgeData = { fromWord: string; toWord: string; description: string };

// GET /api/game/graph
export type GameGraphData = GameGraph & {
  fairytaleId: number;
  selectedCharSpecies: CharSpecies;
  selectedBackground: Background;
};
