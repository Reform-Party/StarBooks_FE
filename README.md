# StarBooks FE

[Expo](https://expo.dev) + [React Native](https://reactnative.dev) 기반의 StarBooks 모바일 앱입니다.

## 🛠 Tech Stack

| 분류        | 사용 기술                                 |
| ----------- | ----------------------------------------- |
| Framework   | Expo SDK 57, React Native, Expo Router    |
| Language    | TypeScript                                |
| State       | Zustand (client), TanStack Query (server) |
| Storage     | expo-secure-store, AsyncStorage           |
| Lint/Format | ESLint (eslint-config-expo), Prettier     |
| Package     | pnpm                                      |

## 🚀 Quick Start

### 사전 준비

- Node.js 20 이상 (권장: 24)
- pnpm (`corepack enable` 또는 `npm i -g pnpm`)
- iOS: Xcode + iOS 시뮬레이터, CocoaPods (`brew install cocoapods`)
- Android: Android Studio + 에뮬레이터
- (선택) Watchman (`brew install watchman`)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/Reform-Party/StarBooks_FE.git
cd StarBooks_FE

# 2. 의존성 설치
pnpm install

# 3. 환경변수 설정
cp .env.example .env

# 4. 개발 서버 실행
pnpm start        # Expo Go / 시뮬레이터 선택
pnpm ios          # iOS 시뮬레이터 바로 실행
pnpm android      # Android 에뮬레이터 바로 실행
```

### 스크립트

| 명령             | 설명                        |
| ---------------- | --------------------------- |
| `pnpm start`     | Metro 개발 서버 실행        |
| `pnpm ios`       | iOS 시뮬레이터에서 실행     |
| `pnpm android`   | Android 에뮬레이터에서 실행 |
| `pnpm lint`      | ESLint 검사                 |
| `pnpm typecheck` | TypeScript 타입 검사        |
| `pnpm format`    | Prettier로 전체 파일 포맷   |

> 네이티브 의존성이 있는 패키지는 반드시 `pnpm exec expo install <package>` 로 추가하세요.
> SDK 버전에 맞는 버전이 자동으로 선택됩니다.

## 📁 Project Structure

```
src/
├── app/          # 화면 (Expo Router 파일 기반 라우팅)
├── components/   # 재사용 컴포넌트
│   └── ui/       # 기본 UI 요소
├── constants/    # 상수, 테마
└── hooks/        # 커스텀 훅
assets/           # 이미지, 폰트 등 정적 리소스
.github/          # CI 워크플로, 이슈/PR 템플릿
```

`@/` 별칭은 `src/` 를 가리킵니다. (`import { Foo } from '@/components/foo'`)

## 🌿 Branching Convention

```
main ─────●────────────●────────────●──── (배포 가능한 상태)
           \          /              /
develop ────●───●───●────●───●─────●───── (다음 배포 준비)
                 \     /      \   /
feat/#12-login ───●──●        ●─●  fix/#34-crash
```

### 브랜치 종류

| 브랜치       | 용도                          | 생성 기준 | 머지 대상         |
| ------------ | ----------------------------- | --------- | ----------------- |
| `main`       | 배포 가능한 안정 버전         | -         | -                 |
| `develop`    | 다음 배포를 위한 통합 브랜치  | `main`    | `main`            |
| `feat/*`     | 새로운 기능 개발              | `develop` | `develop`         |
| `fix/*`      | 버그 수정                     | `develop` | `develop`         |
| `refactor/*` | 기능 변화 없는 코드 구조 개선 | `develop` | `develop`         |
| `chore/*`    | 설정, 빌드, 의존성 등 잡무    | `develop` | `develop`         |
| `hotfix/*`   | 배포 버전의 긴급 수정         | `main`    | `main`, `develop` |
| `release/*`  | 배포 준비 (버전, QA)          | `develop` | `main`, `develop` |

### 브랜치 이름 규칙

```
<type>/#<issue-number>-<short-description>
```

- 소문자와 하이픈(`-`)만 사용합니다.
- 이슈 번호를 반드시 포함합니다. (이슈 없는 작업은 먼저 이슈를 만듭니다.)

```bash
feat/#12-login-screen
fix/#34-tab-bar-crash
chore/#5-ci-setup
```

### 작업 흐름

1. 이슈를 생성하고 담당자를 지정합니다.
2. `develop` 에서 브랜치를 생성합니다.
   ```bash
   git switch develop && git pull
   git switch -c feat/#12-login-screen
   ```
3. 작업 후 커밋하고 push 합니다.
4. `develop` 을 대상으로 PR을 생성합니다. PR 템플릿을 채우고 관련 이슈를 연결합니다. (`closes #12`)
5. CI 통과와 리뷰어 1명 이상의 승인 후 **Squash and merge** 합니다.
6. 머지된 브랜치는 삭제합니다.

## ✍️ Commit Convention

[Gitmoji](https://gitmoji.dev) + [Conventional Commits](https://www.conventionalcommits.org) 형식을 따릅니다.

```
<emoji> <type>: <subject>

[body]
```

| 이모지 | type       | 설명               |
| ------ | ---------- | ------------------ |
| ✨     | `feat`     | 새로운 기능        |
| 🐛     | `fix`      | 버그 수정          |
| ♻️     | `refactor` | 리팩토링           |
| 💄     | `style`    | UI, 스타일 변경    |
| 📝     | `docs`     | 문서               |
| ✅     | `test`     | 테스트             |
| 🔧     | `chore`    | 설정, 빌드, 의존성 |
| ⚡️     | `perf`     | 성능 개선          |
| 🔥     | `remove`   | 코드 / 파일 삭제   |
| 🎉     | `init`     | 프로젝트 시작      |

```bash
✨ feat: 로그인 화면 구현
🐛 fix: 탭 전환 시 크래시 수정
🔧 chore: ESLint, Prettier 설정 추가
```

- 제목은 50자 이내, 마침표 없이 작성합니다.
- 본문에는 **왜** 변경했는지를 적습니다. 무엇을 바꿨는지는 diff가 보여줍니다.
