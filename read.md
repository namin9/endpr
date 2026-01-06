# ⚠️ 변경 금지 규칙 (Hard Rules)

이 문서(read.md)에 정의된 다음 항목은 **명시적 합의 없이는 변경 금지**한다.

- Public URL 구조 (/slug, /posts/page/n, /category/...)
- slug 정책 및 예약어 목록
- 테넌트별 Pages 프로젝트 전제
- build_token 기반 build 인증 방식
- D1 스키마의 핵심 컬럼(status, tenant_id, slug 등)
- preview/share의 noindex,nofollow 정책

※ 구현 편의를 이유로 한 임의 변경은 허용되지 않는다.

Enterprise Multi-Tenant Headless CMS + PR Suite
최종 아키텍처 & 계약면 명세서 v1.1 (Tenant-per-Pages)
0. 목표(불변)

하나의 CMS에서 다수 기업(테넌트)의 블로그/PR 페이지를 운영

SEO/크롤링 최적(정적 HTML)

저비용 운영(Cloudflare 중심)

Draft/Preview는 즉시, Publish는 안정적으로

PR 배포 일정 및 성과 리포트까지 통합

1. 시스템 구성(최종)
1.1 도메인 구성(권장, 불변 원칙)

메인(서비스 소개): www.우리회사.com (Pages)

CMS 앱: cms.우리회사.com (Pages)

API/Worker 단일 진입점: api.우리회사.com (Worker)

고객 블로그: blog.고객사.com (Custom Hostname → 고객별 Pages 프로젝트로 연결)

고객 요구사항 “blog 서브도메인”은 그대로 충족.
실제 블로그는 기업별 Pages 프로젝트가 담당.

1.2 컴포넌트 역할(불변)

CMS(Pages): UI/에디터/설정/리포트

Worker(API): 인증/RBAC/데이터 저장/예약 발행/Cron/배포 트리거/빌드 데이터 제공

D1: 원본 데이터(게시글/설정/PR/배포상태/통계)

R2: 이미지/미디어 원본

Pages(기업별): 정적 사이트 빌드·배포(SEO, sitemap, 페이지네이션 포함)

2. 핵심 전제: “테넌트별 Pages 프로젝트” (이번 v1.1의 확정점)
2.1 왜 필요한가(불변 요구)

기업 A 발행 → 기업 A만 빌드

기업 B 영향 없음

트래픽 큰 기업이 생기면 별도 확장 가능

2.2 구현 모델 2가지(권장 모델 확정)
모델 A(권장): “Pages 프로젝트는 기업별, Repo는 공용 템플릿 하나”

blog-template repo 하나

Pages 프로젝트는 기업별로 여러 개 생성

각 프로젝트는 환경변수/도메인/Deploy Hook만 다름

코드는 하나라 유지보수/업데이트가 쉬움

모델 B: “기업별 repo + 기업별 Pages”

고객 맞춤이 많아지면 유리

초기에는 운영 부담이 커서 비권장

v1.1 권장: 모델 A

3. 데이터/업데이트 흐름(최종)
3.1 Draft/Autosave (즉시성)

CMS → Worker API

D1에 실시간 저장(status=draft)

이미지: 브라우저에서 WebP 변환/압축 후 R2 업로드(Worker가 presign/검증 지원)

이 단계는 절대 빌드/배포 트리거 안 함

3.2 Preview/Share (검수/공유)

preview는 빌드 없이 D1 데이터를 렌더링

공유 링크는 토큰 기반(만료/폐기 가능)

반드시 noindex,nofollow 정책 적용

PDF는 브라우저 인쇄(window.print) 버튼으로 처리(서버 PDF 생성 불필요)

3.3 Publish (안정성)

CMS “발행” → Worker

Worker:

D1 상태 published로 전환

deploy_jobs 생성(queued→building)

해당 테넌트의 pages_deploy_hook_url 호출(기업별)

Pages 프로젝트가 빌드/배포 수행

CMS는 deploy_job 상태를 조회하여 사용자에게 표시

3.4 Scheduled Publish (예약 발행)

Worker Cron이 주기적으로 due posts 조회

테넌트별로 그룹핑하여 테넌트당 1회만 Deploy Hook 호출

배포 상태는 동일하게 deploy_jobs로 추적

4. 계약면(Contract Surface) v1.1 — 변경 금지 영역
4.1 Public URL 계약(SEO 핵심, 불변)

게시글 permalink(고정):
https://blog.고객사.com/{slug}

전체 목록 페이지네이션:
/posts/page/{n}

카테고리 목록 페이지네이션:
/category/{categorySlug}/page/{n}

예약어(슬러그로 사용 금지):
posts, category, tag, search, assets, api, cms, sitemap.xml, robots.txt

4.2 CMS 테넌트 컨텍스트(불변)

기본: cms.우리회사.com

테넌트 지정: cms.우리회사.com/t/{tenantSlug}

고객 블로그에서 CMS 접근:

blog.고객사.com/cms → 위 주소로 리다이렉트(브랜딩은 CMS에서 테넌트 로고/이름 표시로 해결)

4.3 슬러그 정책(불변)

한글 허용

공백→하이픈, 특수문자 제거

중복 시 -2, -3 자동 suffix

v1 정책: 발행 후 slug 변경 금지
(향후 v2에서 alias/301 도입 가능)

4.4 Source of Truth(불변)

원본: D1/R2

Pages는 “결과물 HTML”일 뿐 원본 저장소가 아님

5. “빌드 데이터 제공 방식” 확정(혼동 제거, 보안 강화)

v1.0에서 “host query로 테넌트 식별”은 혼동 여지가 있었습니다.
v1.1에서는 더 단단한 방식으로 확정합니다.

5.1 확정안: 테넌트별 BUILD_TOKEN (권장)

tenants.build_token을 테넌트 생성 시 랜덤 발급

각 테넌트 Pages 프로젝트 환경변수로 BUILD_TOKEN 저장

blog 빌드 시 Worker의 /build/* 엔드포인트 호출 시 x-build-token 헤더로 인증

Worker는 토큰으로 tenant를 식별하므로 host query 불필요

장점

다른 테넌트 데이터 혼입 위험 제거

빌드 파이프라인이 단순

테넌트별 토큰 회전 가능

6. D1 스키마 v1.1 (변경/추가 포함)
6.1 tenants (업데이트)

id (UUID)

slug (tenantSlug)

name

primary_domain (예: blog.customer.com)

pages_project_name (선택)

pages_deploy_hook_url (기업별)

build_token (NEW, 기업별)

created_at

6.2 users

id

tenant_id

email

password_hash

role (editor|admin|super)

created_at

6.3 posts

id, tenant_id

title, slug, excerpt

body_md

category_slug

status (draft|scheduled|published)

publish_at, published_at

created_at, updated_at

6.4 categories

id, tenant_id

slug, name

enabled, order_index

6.5 deploy_jobs

id, tenant_id

triggered_by_user_id

status (queued|building|success|failed)

message

created_at, updated_at

6.6 page_views_daily

tenant_id, page_key, day

views

7. Pages(블로그) 템플릿 계약 v1.1
7.1 빌드 단계에서 생성해야 하는 산출물(불변)

/[slug]/index.html (각 포스트)

/posts/page/{n}/index.html (전체 목록)

/category/{slug}/page/{n}/index.html (카테고리 목록)

/sitemap.xml

/robots.txt

7.2 페이지네이션 변경 비용 문제(100→101개)

이 문제는 정적 페이지네이션의 본질이며, 해결은 “운영 비용을 통제하는 방식”으로 합니다.

빌드가 테넌트별로 분리되어 있으므로 “전체 기업 재빌드”는 없음

기업 한 곳에서 글이 늘어 페이지네이션이 재생성되더라도,

보통 블로그 빌드는 수십 초~수분 단위

초기 저비용 구조에서는 충분히 감당 가능

(후순위) On-demand ISR/부분 빌드는 v2 검토

8. CMS 기능 계약 v1.1
8.1 반드시 제공해야 하는 UX

Draft autosave(저장 시간 표시)

Publish 후 deploy 상태 표시(배포중/완료/실패)

Preview/Share 링크 생성/폐기

PDF 버튼(window.print)

카테고리 ON/OFF/추가/정렬(설정 기반)

테마 선택(프리셋/토큰 기반)

8.2 카테고리/테마 반영 원칙(불변)

카테고리/메뉴는 “코드 하드코딩 금지”

설정 또는 categories 테이블로부터 자동 렌더링

테마는 토큰/프리셋으로 제공

테넌트별 임의 CSS/JS는 엔터프라이즈 옵션으로 분리

9. PR 모듈 v1.1 (추가 확정)
9.1 PR은 campaign 단위(불변)

PR 캠페인 생성

배포 예약/진행/완료 상태

게재 링크 수집

성과 리포트(월간/캠페인별)

9.2 PR MVP 범위(확정)

자동 모니터링/크롤링은 v2

v1은 수동/반자동 입력으로도 “리포트 가치” 제공

9.3 추가 D1 테이블(요약)

pr_campaigns

pr_distribution_targets (후순위)

pr_distribution_runs

pr_mentions

pr_reports

10. 개발 스택 v1.1 (바이브 코딩 최적화)
10.1 확정 추천

TypeScript 단일 언어

Worker: Hono + Zod + SQL 직접

CMS: React + Vite (+ Tailwind/shadcn 또는 Bootstrap)

Blog: Astro SSG + remark/rehype + sanitize

Image: browser-image-compression

Charts: Recharts(리포트)

11. 프로비저닝(기업 생성) 플로우 v1.1 (필수 구현)
11.1 Super Admin “기업 생성” 버튼이 해야 할 일

D1에 tenant 생성

build_token 랜덤 발급

Cloudflare Pages 프로젝트 생성(기업별)

Pages 프로젝트에 env 세팅:

PUBLIC_API_BASE=https://api.우리회사.com

BUILD_TOKEN=tenant.build_token

Custom Hostname 연결(blog.고객사.com)

Deploy Hook 생성 및 URL을 D1에 저장(pages_deploy_hook_url)

이 과정을 자동화하지 못해도, 초기에는 “반자동(수동 세팅 + D1 입력)”으로 MVP 운영 가능.

12. 보완 필요 부분(미결정/리스크) — v1.1에서의 제언
12.1 배포 상태 추적의 정확도

v1 MVP: Deploy Hook 호출 성공을 기준으로 “success”로 처리 가능

운영 안정화: Pages 배포 상태 API 폴링/웹훅을 붙여 진짜 빌드 완료를 success로 표시 권장

제언: 초기엔 간이로 시작하되, 고객이 늘면 반드시 고도화.

12.2 멀티테넌트 보안

모든 CMS 요청은 session의 tenant_id와 리소스 tenant_id 비교

build 엔드포인트는 build_token 기반(tenant 고정)

제언: build_token은 회전 가능하도록 설계(유출 대비).

12.3 테마/프리셋 확장 정책

레이아웃 5~8개 + 토큰 20~40개로 “20개 테마처럼 보이기”

개별 CSS/JS 커스텀은 유료화 경계

제언: 정책을 문서화해 CS 범위를 통제.

13. 실행 체크리스트(가장 현실적인 순서)

D1 스키마 v1.1 확정 + 최소 시드(tenant/user)

Worker:

auth/session

posts CRUD + autosave + publish + deploy_jobs

build endpoints(build_token 방식)

CMS:

로그인

글쓰기(autosave)

발행 + deploy 상태 표시

preview + print(PDF)

Blog 템플릿:

post/permalink

posts pagination

category pagination

sitemap

PR 모듈:

campaigns + mentions(수동) + reports 화면
