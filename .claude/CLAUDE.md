# 가계부 웹 프로젝트 - 작업 가이드

> 기술 스택 및 선정 이유는 README.md 참고

## 자주 쓰는 명령어

### 프론트엔드 (frontend/)
| 명령어 | 설명 |
|---|---|
| `npm install` | 의존성 설치 |
| `npm run dev` | 개발 서버 실행 (Vite HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run test` | Vitest 단위/컴포넌트 테스트 |
| `npm run test:e2e` | Playwright E2E 테스트 |

### 백엔드 (backend/)
| 명령어 | 설명 |
|---|---|
| `./gradlew bootRun` | 개발 서버 실행 |
| `./gradlew build` | 빌드 (테스트 포함) |
| `./gradlew test` | JUnit 단위/통합 테스트 |
| `./gradlew bootJar` | 실행 가능한 jar 생성 |

### 인프라 (infra/)
| 명령어 | 설명 |
|---|---|
| `docker-compose up -d` | 로컬에서 백엔드+PostgreSQL+Caddy 전체 스택 실행 |
| `docker-compose down` | 전체 스택 종료 |
| `docker-compose logs -f backend` | 백엔드 로그 확인 |

## 코드 컨벤션

### 프론트엔드
- 포매팅/린트: ESLint + Prettier. 커밋 전 자동 검사 권장 (husky + lint-staged)
- 컴포넌트 파일명: `PascalCase.tsx` (컴포넌트명과 동일)
- 변수/함수: `camelCase`, 컴포넌트/타입: `PascalCase`
- 커스텀 훅: `use{Name}` 규칙 준수
- import는 절대경로 사용 (tsconfig `paths` 설정), 상대경로는 같은 폴더 내에서만 허용

### 백엔드
- 포매팅: Spotless (Google Java Format 기반), Gradle 빌드 시 자동 검사
- 패키지 구조: 계층형이 아닌 도메인 기준 패키징 (예: `com.gagyebu.transaction`, `com.gagyebu.account`)
- Controller → Service → Repository 계층 분리, Entity와 API 응답 DTO는 반드시 분리
- 클래스/메서드: 표준 Java 컨벤션 (`PascalCase` 클래스, `camelCase` 메서드/변수)

## Git 컨벤션

### 브랜치 전략
- `main`: 항상 배포 가능한 상태 유지, 실제 운영 서버에 배포되는 브랜치
- 작업은 `feature/기능명`, `fix/버그명`, `chore/작업명` 브랜치를 짧게 따서 작업 후 `main`에 머지
- develop/staging 같은 중간 브랜치는 두지 않음 (혼자 개발 + 짧은 배포 주기)
- 예: `feature/transaction-crud`, `fix/login-token-expire`, `chore/gradle-upgrade`

### 커밋 메시지 컨벤션 (Conventional Commits)
형식: `<type>(<scope>): <subject>`
- type: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`
- scope: `frontend`, `backend`, `infra` 중 변경된 영역
- subject: 명령형으로 간결하게

예시:
- `feat(backend): 거래 내역 CRUD API 추가`
- `fix(frontend): 차트 애니메이션 깜빡임 수정`
- `chore(infra): docker-compose postgres 버전 업데이트`

### 머지 방식
- `feature` 브랜치 → PR 생성 → GitHub Actions lint/test 통과 확인 → `main` 머지 권장
- 급한 수정은 `main`에 바로 커밋 가능 (혼자 쓰는 프로젝트라 유연하게)

### 버전 태깅
- 배포 시점마다 `v0.1.0` 형식의 Semantic Versioning 태그 부여, 롤백/이력 추적용
