# AGENTS.md

StarBooks FE는 Expo SDK 57 + React Native + Expo Router 기반 모바일 앱입니다.
이 문서는 사람과 AI 에이전트 모두가 따르는 **작업 프로세스와 규칙**입니다.
모바일 우선, 성능, iOS/Android 크로스 플랫폼 호환을 최우선으로 합니다.

---

## 1. 작업 프로세스 (Issue → Ship)

모든 변경은 아래 흐름을 따릅니다. 단계를 건너뛰지 않습니다.

```
Issue → Plan → Branch → Small PR → CI → Review → Squash Merge → Release
```

### 1.1 Issue

- 작업은 **이슈에서 시작**합니다. 이슈 없는 작업은 먼저 이슈를 만듭니다.
- 이슈 템플릿(`.github/ISSUE_TEMPLATE/`)의 필수 항목을 채웁니다.
- 하나의 이슈는 **1~3일 안에 끝나는 크기**여야 합니다. 더 크면 하위 이슈로 쪼갭니다.

### 1.2 Plan (구현 전)

- 파일을 수정하기 전에 **무엇을, 왜, 어떻게** 바꿀지 짧게 정리합니다.
- 기존 코드를 먼저 읽습니다. 비슷한 패턴이 이미 있으면 그것을 따릅니다.
- 요구사항이 모호하면 추측하지 말고 이슈에 질문을 남깁니다.
- 새 의존성이 필요하면 추가 전에 이유와 대안을 이슈/PR에 적습니다.

### 1.3 Branch

- `develop` 에서 분기합니다. (hotfix만 `main` 에서)
- 이름 규칙: `<type>/#<issue>-<short-description>`
  예) `feat/#12-login-screen`, `fix/#34-tab-bar-crash`

### 1.4 Small PR

- **PR 하나는 하나의 관심사**만 다룹니다. 리팩토링과 기능 추가를 섞지 않습니다.
- 목표 크기: **변경 300줄 이하**. 넘으면 PR을 나눕니다. (Stacked PR 허용)
- 초기에 **Draft PR**로 열어 방향을 공유하고, 완료되면 Ready for review로 전환합니다.
- PR 템플릿(`.github/PULL_REQUEST_TEMPLATE.md`)을 채우고 `closes #<issue>` 로 이슈를 연결합니다.
- UI 변경은 **Before / After 스크린샷 또는 녹화**를 반드시 첨부합니다.

### 1.5 Verify (PR 올리기 전)

로컬에서 아래를 모두 통과해야 합니다. CI도 같은 것을 검사합니다.

```bash
pnpm lint
pnpm typecheck
pnpm exec prettier --check .
```

- iOS 시뮬레이터(및 가능하면 Android)에서 **실제로 실행해서** 확인합니다.
- 다크 모드, 작은 화면(iPhone SE), 큰 화면에서 깨지지 않는지 봅니다.
- `console.log`, 디버그 코드, 주석 처리된 코드를 제거합니다.

### 1.6 Review

- **리뷰어 1명 이상 승인 + CI 통과**가 머지 조건입니다.
- 리뷰 요청을 받으면 **24시간 안에** 첫 응답을 합니다.
- 리뷰어는 코드가 아니라 **설계·정확성·유지보수성**을 봅니다. 포맷은 도구가 잡습니다.
- 리뷰 체크리스트: [`.github/CODE_REVIEW.md`](.github/CODE_REVIEW.md) 를 기준으로 봅니다.
- 코멘트에는 접두어를 붙입니다.
  - `blocking:` 머지 전에 반드시 해결
  - `suggestion:` 제안, 작성자 판단에 맡김
  - `nit:` 사소한 것
  - `question:` 이해를 위한 질문
- 작성자는 모든 코멘트에 응답(수정 또는 이유 설명)한 뒤 re-review를 요청합니다.

### 1.7 Merge & Release

- **Squash and merge**만 사용합니다. 머지 커밋 제목은 커밋 컨벤션을 따릅니다.
- 머지 후 브랜치를 삭제합니다.
- `develop` → `main` 은 `release/*` 브랜치를 통해 QA 후 머지합니다.
- 버전은 `app.json`의 `version` 을 올리고 태그(`v1.2.0`)를 답니다.
- 네이티브 변경이 없는 수정은 `eas update` 로 OTA 배포, 있으면 `eas build` 로 새 빌드를 만듭니다.

---

## 2. 명령어

pnpm을 사용합니다. `npx` 대신 `pnpm exec` 를 씁니다.

```bash
pnpm install                      # 의존성 설치
pnpm start                        # Metro 개발 서버
pnpm ios / pnpm android           # 시뮬레이터 실행
pnpm lint                         # ESLint
pnpm typecheck                    # tsc --noEmit
pnpm format                       # Prettier 전체 포맷
pnpm exec expo install <pkg>      # 네이티브 의존성 추가 (반드시 이 명령 사용)
pnpm exec expo install --check    # SDK 호환 버전 검사
pnpm dlx expo-doctor              # 프로젝트 진단
```

**작업을 끝냈다고 말하기 전에 lint와 typecheck를 반드시 실행합니다.**

---

## 3. 코드 규칙

### 구조

```
src/
├── app/          # 화면만. Expo Router 파일 기반 라우팅. _layout.tsx 가 네비게이터
├── components/   # 재사용 컴포넌트 (ui/ 는 기본 요소)
├── constants/    # 상수, 테마
└── hooks/        # 커스텀 훅
```

- 화면이 아닌 코드(컴포넌트, 훅, 유틸)는 `src/app/` 밖에 둡니다.
- 새 도메인 코드는 `src/features/<domain>/` 아래에 모읍니다. (api, hooks, components, store)
- import는 `@/` 별칭을 사용합니다. 상대 경로 `../../` 는 쓰지 않습니다.

### TypeScript

- `any` 금지. 불가피하면 `unknown` 으로 받고 좁힙니다.
- 컴포넌트 props는 `type Props = { ... }` 로 선언하고 `export default function` 으로 내보냅니다.
- API 응답 타입은 서버 스펙 기준으로 정의하고 한 곳에서 관리합니다.

### 상태 관리

- 서버 데이터: **TanStack Query**. 컴포넌트에서 직접 fetch하지 않습니다.
- 클라이언트 전역 상태: **Zustand**. 화면 하나에서만 쓰는 상태는 `useState` 로 둡니다.
- 민감 정보(토큰 등): `expo-secure-store`. 일반 설정: `AsyncStorage`.

### 컴포넌트

- 함수 컴포넌트 + 훅만 사용합니다.
- 파일 하나에 컴포넌트 하나. 파일명은 kebab-case, 컴포넌트명은 PascalCase.
- 스타일은 `StyleSheet.create` 를 사용하고 인라인 스타일은 피합니다.
- 리스트는 `FlatList` / `FlashList` 를 쓰고 `ScrollView` + `map` 은 쓰지 않습니다.
- `useEffect` 안에서 `setState` 를 직접 호출하지 않습니다. (react-hooks 규칙)

### 네이밍

- 파일: `kebab-case.tsx`
- 컴포넌트/타입: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- 훅: `use` 접두어
- 이벤트 핸들러: `handle` 접두어, prop은 `on` 접두어

---

## 4. 커밋 컨벤션

```
<emoji> <type>: <subject>
```

| 이모지 | type       | 용도             |
| ------ | ---------- | ---------------- |
| ✨     | `feat`     | 새 기능          |
| 🐛     | `fix`      | 버그 수정        |
| ♻️     | `refactor` | 리팩토링         |
| 💄     | `style`    | UI/스타일        |
| 📝     | `docs`     | 문서             |
| ✅     | `test`     | 테스트           |
| 🔧     | `chore`    | 설정/빌드/의존성 |
| ⚡️     | `perf`     | 성능             |
| 🔥     | `remove`   | 삭제             |

- 제목 50자 이내, 마침표 없음, 본문에는 **왜**를 적습니다.
- 브랜치/커밋/PR 규칙의 전체 설명은 `README.md` 를 참고합니다.

---

## 5. Expo 규칙 (반드시 준수)

### Expo는 매 SDK마다 바뀝니다. 기억에 의존하지 마세요.

Expo, EAS, React Native API를 다루기 전에:

1. `package.json` 의 `expo` 메이저 버전을 확인합니다. (현재 57)
2. 해당 버전 문서를 읽습니다: `https://docs.expo.dev/versions/v57.0.0/`
3. 그 외는 https://docs.expo.dev/llms.txt 에서 링크를 따라가 확인합니다.

### 네이티브

- `ios/`, `android/` 폴더는 **생성물**(Continuous Native Generation)입니다. 직접 만들거나 수정하지 않습니다. 네이티브 설정은 `app.json` 과 config plugin으로 합니다.
- Expo Go는 내장 네이티브 모듈만 지원합니다. 네이티브 코드가 있는 라이브러리를 추가하면 development build가 필요합니다: `pnpm exec expo run:ios` 또는 `eas build --profile development`.
- 서드파티보다 Expo 공식 모듈을 우선합니다.

### 라우팅

- 모든 네비게이션은 **Expo Router** 를 사용합니다. `Link`, `router`, `useLocalSearchParams` 는 `expo-router` 에서 import 합니다.
- `typedRoutes` 가 켜져 있으므로 경로 문자열은 타입 검사를 받습니다.

### EAS

- 빌드/제출/OTA는 EAS를 사용합니다: `pnpm exec eas-cli <command>`.
- 문서: https://docs.expo.dev/eas/index.md

---

## 6. 하지 말 것

- `develop` / `main` 에 직접 push
- 리뷰 없이 머지
- `pnpm add` 로 네이티브 라이브러리 추가 (→ `expo install`)
- `.env` 커밋, 시크릿 하드코딩
- `ios/`, `android/` 직접 수정
- 이슈와 무관한 변경을 PR에 끼워 넣기
- 테스트/검증 없이 "완료" 보고

---

## 7. 완료 기준 (Definition of Done)

- [ ] 이슈의 요구사항을 모두 충족
- [ ] `pnpm lint`, `pnpm typecheck`, `prettier --check` 통과
- [ ] iOS 시뮬레이터에서 실제 동작 확인 (UI 변경 시 Android도)
- [ ] PR 템플릿 작성, 이슈 연결, 스크린샷 첨부
- [ ] 리뷰어 승인 + CI 통과
- [ ] Squash merge 후 브랜치 삭제
