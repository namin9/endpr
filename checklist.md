# 작업 체크리스트 (v1.2) — read.md 계약면 준수

## 0) 하드 룰(변경 금지)
- [ ] read.md의 계약면(URL/slug/예약어/build_token/noindex 정책/D1 핵심 컬럼)을 **임의 변경하지 않는다**
- [ ] 계약/스키마 변경은 전용 PR 1건으로 선반영 후 다른 브랜치가 rebase 한다
- [ ] Worker/API는 `endpr.pages.dev` 단일 진입점 유지(클라우드 플레어 배포 페이지임 향후 도메인 추가 예정)
- [ ] 테넌트별 Pages 프로젝트(빌드 단위 분리) 전제 유지

---

## 1) 목표 및 운영 원칙 (DoD 포함)
- [ ] CMS 하나에서 다수 테넌트의 블로그/PR 페이지 운영 구조 유지
  - DoD: 테넌트 A/B 각각 로그인·발행·빌드가 상호 영향 없이 동작
- [ ] 정적 HTML 기반 SEO/크롤링 최적화 확인
  - DoD: `sitemap.xml`, `robots.txt`, permalink/페이지네이션 URL 정상
- [ ] Cloudflare Pages/Workers 중심의 저비용 운영 보장
  - DoD: 서버(VM) 미사용, Cloudflare 리소스로만 구동
- [ ] Draft/Preview 즉시성, Publish 안정성 확보
  - DoD: Draft 저장은 즉시 반영, Publish는 deploy_job 상태로 사용자에게 피드백
- [ ] PR 배포 일정 및 성과 리포트 흐름 일원화
  - DoD: PR 캠페인 1건 생성→mentions 입력→리포트 화면 표시

---

## 2) 도메인 및 프로젝트 구성
### 2.1 도메인 분리
- [ ] `www`(소개), `cms`(UI), `api`(Worker), `blog.고객사.com`(테넌트별 Pages) 구성 명문화/확인

### 2.2 테넌트별 Pages 프로젝트(필수)
- [ ] 테넌트별 Pages 프로젝트 생성(기업 A/B 최소 2개로 검증)
- [ ] Custom Hostname 연결(각각 `blog.A.com`, `blog.B.com`)
- [ ] Pages 환경변수 설정:
  - [ ] `PUBLIC_API_BASE=https://api.우리회사.com`
  - [ ] `BUILD_TOKEN=<tenant.build_token>`
- [ ] Pages Deploy Hook 생성 및 D1에 `pages_deploy_hook_url` 저장

DoD:
- A 글 발행 → A Pages만 빌드(Deploy Hook 호출 확인)
- B는 빌드되지 않음

---

## 3) 데이터 보안 및 빌드 토큰(build_token)
### 3.1 토큰 발급/저장
- [ ] 테넌트 생성 시 `build_token` 랜덤 발급 (회전 가능 구조)
- [ ] D1 tenants에 저장 및 Pages 환경변수에 반영

### 3.2 Worker build 인증(필수)
- [ ] Worker `/build/*` 엔드포인트에서 `x-build-token` 헤더로 테넌트 식별 구현
- [ ] host query 기반 테넌트 식별은 사용하지 않음(v1.1 확정)

### 3.3 토큰 회전(문서화)
- [ ] build_token 회전 절차 문서화(유출 대응)
  - 새 토큰 발급 → Pages env 업데이트 → 기존 토큰 폐기

DoD:
- 잘못된 토큰으로 `/build/*` 호출 시 401
- 올바른 토큰으로만 빌드 데이터 수신

---

## 4) D1 스키마 적용 (DB/스키마 담당)
### 4.1 코어 테이블
- [ ] tenants(build_token, pages_deploy_hook_url 포함)
- [ ] users
- [ ] posts
- [ ] categories
- [ ] deploy_jobs
- [ ] page_views_daily

### 4.2 PR 테이블(v1 범위)
- [ ] pr_campaigns
- [ ] pr_distribution_runs (최소 필드)
- [ ] pr_mentions
- [ ] pr_reports

DoD:
- 마이그레이션 1회로 초기 구성 가능
- 최소 seed(tenant 1개 + admin 1명) 제공

---

## 5) Worker/API 구현 (API 담당)
> 구현 순서: Auth → RBAC → Posts → Deploy Jobs → Build Endpoints → Cron → Stats

### 5.1 인증/세션
- [ ] 로그인 API 구현(`/cms/auth/login`)
- [ ] 세션 쿠키(HttpOnly) 발급 및 검증
- [ ] `/cms/auth/me` 구현

DoD:
- 로그인 성공 시 세션 쿠키 설정
- 미로그인 요청은 401

### 5.2 RBAC/테넌트 격리
- [ ] 모든 CMS API에서 `session.tenant_id`와 리소스 tenant 일치 검증
- [ ] role 기반 권한 체크(최소 editor/admin/super)

DoD:
- 다른 tenant의 post_id 접근 시 403/404로 차단

### 5.3 Posts CRUD + Autosave
- [ ] POST /cms/posts (초안 생성)
- [ ] GET /cms/posts (목록)
- [ ] GET /cms/posts/:id (상세)
- [ ] POST /cms/posts/:id/autosave (draft 저장)
- [ ] 예약어 slug 사전 차단(CMS/API)

DoD:
- autosave 시 updated_at 갱신, saved_at 반환

### 5.4 Publish + Deploy Jobs
- [ ] POST /cms/posts/:id/publish
  - status=published 전환, published_at 설정
  - deploy_jobs 생성(queued→building)
  - tenants.pages_deploy_hook_url 호출
- [ ] GET /cms/deploy-jobs (리스트)
- [ ] GET /cms/deploy-jobs/:id (상세)
- [ ] Pages 빌드 완료 Webhook에서 deploy_jobs 상태 업데이트
  - [ ] `PAGES_WEBHOOK_SECRET` 바인딩 설정
  - [ ] project_name 기반 테넌트 매칭 및 최신 active job 갱신
  - [ ] webhook payload status 필드 매핑 확인(queued/building/success/failed)

DoD:
- publish 후 CMS에서 deploy 상태 확인 가능

### 5.5 Build Endpoints (SSG용)
- [ ] `/build/posts` (published 목록)
- [ ] `/build/post/:slug` (published 단건)
- [ ] `/build/categories` (enabled categories)

제약:
- x-build-token 필수

### 5.6 Scheduled Publish Cron
- [ ] due posts(status=scheduled AND publish_at<=now) 조회
- [ ] 테넌트별로 그룹핑하여 Deploy Hook 1회 호출
- [ ] deploy_jobs 생성

DoD:
- 예약 시간이 되면 자동 발행/빌드 트리거

### 5.7 Public Stats (선택: v1 최소)
- [ ] `/public/view` (page_views_daily 증가; bot/관리자 제외는 후순위)

---

## 6) CMS 구현 (프런트 담당)
> 구현 순서: Login → Session 유지 → Editor(Autosave) → Publish/DeployStatus → Preview/Share → Categories/Theme → PR

### 6.1 로그인 + 세션 확인
- [ ] 로그인 UI(tenantSlug/email/password)
- [ ] 로그인 성공 후 `/me` 호출로 세션 표시/유지

### 6.2 에디터 + Autosave
- [ ] 글 생성 → 편집 화면 진입
- [ ] autosave 디바운스(예: 1~2초)
- [ ] 저장 시간 표시(saving/saved_at)

DoD:
- 입력 후 2초 내 saved 표시

### 6.3 Publish + Deploy Status
- [ ] 발행 버튼
- [ ] deploy_job id 수신
- [ ] deploy_jobs/:id 폴링하여 상태 표시(queued/building/success/failed)

DoD:
- 발행 후 배포 상태를 사용자가 인지 가능

### 6.4 Preview/Share (v1)
- [ ] preview 모드로 D1 draft/published 렌더링
- [ ] 공유 링크 생성/폐기(토큰 기반)
- [ ] preview/share는 noindex/nofollow 적용(메타/헤더)

DoD:
- 공유 링크는 로그인 없이 열리되 만료/폐기 가능
- 검색엔진 색인 방지 설정 확인

### 6.5 PDF
- [ ] window.print 버튼 제공

### 6.6 카테고리 관리
- [ ] 카테고리 추가/수정/ON/OFF/정렬 UI
- [ ] 사이트는 카테고리를 데이터 기반으로 렌더링(하드코딩 금지)

### 6.7 테마(프리셋/토큰)
- [ ] 프리셋 선택 UI + 기본 토큰 설정
- [ ] 임의 CSS/JS 커스텀은 UI에 노출하지 않음(엔터프라이즈 옵션)

---

## 7) Blog 템플릿(SSG) 구현 (BLOG 담당)
> 구현 순서: build fetch → permalink → 목록 페이지네이션 → 카테고리 페이지네이션 → sitemap/robots

### 7.1 빌드 데이터 수신
- [ ] 빌드 시 Worker `/build/*` 호출
- [ ] x-build-token 헤더 포함(환경변수)

DoD:
- 로컬/Pages 빌드 모두 동일하게 동작

### 7.2 정적 산출물
- [ ] permalink `/[slug]/index.html`
- [ ] 전체 목록 `/posts/page/{n}/index.html`
- [ ] 카테고리 목록 `/category/{slug}/page/{n}/index.html`

### 7.3 SEO 산출물
- [ ] `sitemap.xml` (published + 목록/카테고리 페이지 포함)
- [ ] `robots.txt`

### 7.4 슬러그 예약어/정책 준수
- [ ] 예약어 충돌 시 빌드 단계에서 제외 또는 빌드 실패(정책 1개로 고정)
- [ ] 발행 후 slug 변경 불가 정책 준수(리디렉션 v2)

---

## 8) PR 모듈 (PR 담당)
> v1: 수동/반자동 입력 기반으로 가치 제공 (자동 모니터링 v2)

### 8.1 캠페인
- [ ] PR 캠페인 생성/수정/상태 변경(draft/scheduled/completed 등)
- [ ] 배포 일정(scheduled_at) 입력

### 8.2 Mentions(게재 링크)
- [ ] 게재 링크 수동 입력(매체명/URL/발행일/메모)
- [ ] 캠페인별 mentions 리스트 표시

### 8.3 Reports
- [ ] 월간/캠페인별 리포트 화면
  - highlights(요약)
  - mentions 테이블
  - 트래픽 요약(있으면)

DoD:
- 캠페인 1건에 대해 리포트 화면이 “결과물”처럼 보이게 구성

---

## 9) 프로비저닝(기업 생성) 플로우 (Super Admin)
> v1은 반자동 허용. 단, 절차 문서화 필수.

- [ ] D1 tenant 생성(build_token 포함)
- [ ] Pages 프로젝트 생성(수동/자동)
- [ ] env 설정(PUBLIC_API_BASE, BUILD_TOKEN)
- [ ] Custom Hostname 연결
- [ ] Deploy Hook 발급 후 D1 저장

DoD:
- 신규 테넌트 1개를 30분 내 온보딩 가능한 절차 문서 확보

---

## 10) 배포/모니터링 정책
- [ ] v1: Deploy Hook 호출 성공 시 success 처리(간이)
- [ ] v1.5/v2: Pages 배포 상태 API 폴링/웹훅 도입 검토 항목 추가

---

## 11) 최소 QA 시나리오 (릴리즈 게이트)
- [ ] (A) 테넌트 A/B 생성
- [ ] (B) A 로그인 → 글 작성 → autosave 확인
- [ ] (C) A 발행 → deploy_job 상태 표시 → A 블로그 반영 확인
- [ ] (D) B 블로그는 변경 없음 확인
- [ ] (E) build_token 틀리면 /build 401 확인
- [ ] (F) preview 링크 noindex 확인
- [ ] (G) PR 캠페인 생성 → mentions 입력 → 리포트 화면 확인

---

## 12) 역할별 개발 분담 및 브랜치 규칙
- [ ] 공통 원칙: read.md 계약면 변경 금지
- [ ] 브랜치 네이밍: `gpt-<role>/<task>` (예: `gpt-api/publish-deployjobs`)
- [ ] 타 영역 파일 수정 금지(예외는 합의된 단일 PR)
- [ ] 병합 전 필수: `git fetch && git rebase origin/main`
- [ ] 병합 순서: DB → API → BLOG → CMS → PR
