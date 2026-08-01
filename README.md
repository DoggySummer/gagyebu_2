# 가계부 웹 프로젝트

개인용 가계부 웹 애플리케이션.

> 마지막 업데이트: 2026-08-01 기준 최신 안정 버전

## 프론트엔드

| 기술 | 버전 | 사용 이유 |
|---|---|---|
| Node.js | 24.x (Active LTS) | 개발/빌드 런타임. LTS라 안정적 |
| React | 19.2.x | 프론트엔드 프레임워크 (요구사항) |
| TypeScript | 6.0.x | 타입 안정성 (요구사항) |
| Vite | 8.x | 빠른 빌드/HMR, React+TS 템플릿 즉시 생성 가능 |
| Tailwind CSS | 최신 v4 | 빠른 스타일링, 커스텀 디자인 시스템 불필요 |
| AG Grid | Community 최신 | 거래 내역 리스트의 정렬/필터/페이징 처리 |
| ECharts (echarts-for-react) | 최신 | 지출 통계용 애니메이션 차트 (라인/바/파이 전환 효과) |

## 백엔드

| 기술 | 버전 | 사용 이유 |
|---|---|---|
| Node.js | 24.x (Active LTS) | 런타임. 프론트엔드와 동일 버전 사용 |
| Hono | 4.12.x | 초경량(14KB) 웹 프레임워크. Web Standards 기반이라 Node/Bun/Deno/Cloudflare Workers 등 어디서나 동일 코드로 실행 가능, TypeScript 타입 추론 우수 |
| TypeScript | 6.0.x | 프론트엔드와 동일 버전. 언어를 통일해 타입 공유 및 컨텍스트 스위칭 비용 감소 |
| Drizzle ORM | 0.45.x | 가볍고 SQL에 가까운 문법, PostgreSQL과 궁합 좋고 타입 안전한 쿼리 작성 가능 |
| postgres.js | 최신 | Drizzle 공식 지원 PostgreSQL 드라이버 중 가장 빠른 드라이버 |
| hono/jwt (Hono 내장 미들웨어) | Hono 코어 포함 | 별도 라이브러리 설치 없이 JWT 기반 로그인 인증 처리 |

> 기존에는 Java + Spring Boot로 구성했으나, 프론트/백엔드 언어를 TypeScript로 통일하기 위해 Hono로 변경함 (2026-08-01)

## DB 서버

| 기술 | 버전 | 사용 이유 |
|---|---|---|
| PostgreSQL | 최신 안정 (16/17) | 가계부 데이터는 트랜잭션 무결성이 중요해 관계형 DB 선택. Drizzle ORM과 궁합 좋음 |
| 배포 방식 | Docker 컨테이너 | 로컬 개발/운영 환경 동일하게 유지 |

## 인프라

| 항목 | 선택 | 사용 이유 |
|---|---|---|
| 서버 | Oracle Cloud Always Free ARM VM (2 OCPU/12GB, 서울 리전) | 개인 프로젝트 예산(월 1-2만원) 대비 스펙 대비 비용 0원이 최적. 대안: DigitalOcean Droplet $6~12/월(설정 단순), 네이버클라우드 마이크로(1년 무료, 국내 레이턴시) |
| 컨테이너 오케스트레이션 | Docker Compose | Hono + PostgreSQL + Caddy를 한 번에 관리, 혼자 운영하기에 적당한 복잡도 |
| 리버스 프록시 / HTTPS | Caddy | Let's Encrypt 인증서 자동 발급/갱신, 설정 간단 |
| CI/CD | GitHub Actions | 모노레포 path filter로 프론트/백엔드 변경 시에만 해당 빌드 실행 |
| 리포지토리 구조 | 모노레포 (frontend/, backend/, infra/) | 혼자 개발 + 한 서버에 같이 배포하는 구조라 API 변경을 한 커밋으로 관리하는 게 유리 |

## 테스팅

| 영역 | 툴 | 버전 | 사용 이유 |
|---|---|---|---|
| 프론트 단위/컴포넌트 테스트 | Vitest + React Testing Library | Vitest 4.x | Vite 네이티브라 빌드 설정 재사용, Jest 대비 빠름 |
| 프론트 E2E | Playwright | 1.62.x | 멀티 브라우저 지원, TypeScript 친화적, Cypress 대비 안정적 |
| 백엔드 단위/통합 테스트 | Vitest | 4.x | 프론트와 동일 도구로 통일, 테스트 러너 하나로 유지보수 부담 감소 |
| 백엔드 DB 통합 테스트 | Testcontainers (Node.js용) | 최신 | 실제 PostgreSQL 컨테이너로 테스트해 운영 환경과 동일하게 검증 |
