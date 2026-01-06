# 작업 체크리스트 (read.md 기반)

## 목표 및 운영 원칙
- [ ] CMS 하나에서 다수 테넌트의 블로그/PR 페이지 운영 구조 유지
- [ ] 정적 HTML 기반 SEO/크롤링 최적화 확인
- [ ] Cloudflare Pages/Workers 중심의 저비용 운영 보장
- [ ] Draft/Preview 즉시성, Publish 안정성 확보
- [ ] PR 배포 일정 및 성과 리포트 흐름 일원화

## 도메인 및 프로젝트 구성
- [ ] 도메인 분리 적용: www(소개), cms(UI), api(Worker), blog.고객사.com(개별 Pages)
- [ ] 테넌트별 Pages 프로젝트 생성 및 Custom Hostname 연결 검증
- [ ] Pages 프로젝트 환경변수 세팅: `PUBLIC_API_BASE`, `BUILD_TOKEN`
- [ ] Pages Deploy Hook 생성 및 D1에 `pages_deploy_hook_url` 저장

## 데이터 보안 및 빌드 토큰
- [ ] 테넌트 생성 시 `build_token` 발급 및 Pages 환경변수 반영
- [ ] Worker `/build/*` 엔드포인트에서 `x-build-token` 인증으로 테넌트 식별 구현/검증
- [ ] build_token 회전 절차 고려 및 문서화

## D1 스키마 적용
- [ ] `tenants` 테이블에 `build_token`, `pages_deploy_hook_url` 포함
- [ ] `users`, `posts`, `categories`, `deploy_jobs`, `page_views_daily` 정의 적용
- [ ] PR 모듈용 `pr_campaigns`, `pr_distribution_runs`, `pr_mentions`, `pr_reports` 테이블 설계

## CMS 기능 구현
- [ ] 로그인 및 멀티테넌트 RBAC(session tenant 확인) 구현
- [ ] 글쓰기 autosave(Draft 저장 시간 표시) 및 preview/share 링크(noindex/nofollow) 제공
- [ ] Publish 시 `deploy_jobs` 상태(queued/building/success/failed) 표시
- [ ] PDF 인쇄 버튼(window.print) 제공
- [ ] 카테고리 ON/OFF/추가/정렬 기능 구현(설정/DB 기반 렌더링)
- [ ] 테마 프리셋/토큰 적용 및 임의 CSS/JS는 엔터프라이즈 옵션으로 분리

## Worker 기능 구현
- [ ] 인증/RBAC/세션 처리
- [ ] posts CRUD + autosave + publish + deploy_jobs 생성/갱신 구현
- [ ] build endpoints에서 테넌트별 데이터 제공(`x-build-token` 기반)
- [ ] Scheduled Publish Cron: due posts 조회 후 테넌트별 Deploy Hook 1회 호출

## Blog(렌더링) 템플릿
- [ ] permalink `/[slug]/index.html` 생성
- [ ] 전체 목록 `/posts/page/{n}/index.html` 페이지네이션 생성
- [ ] 카테고리 목록 `/category/{slug}/page/{n}/index.html` 생성
- [ ] `sitemap.xml`, `robots.txt` 포함
- [ ] 슬러그 예약어(posts, category, tag, search, assets, api, cms, sitemap.xml, robots.txt) 차단
- [ ] 게시 후 슬러그 변경 불가 정책 준수

## PR 모듈
- [ ] 캠페인 생성/상태(예약·진행·완료) 관리
- [ ] 게재 링크 수집/입력 및 월간·캠페인별 리포트 화면 제공
- [ ] 자동 모니터링은 후순위(v2), v1은 수동/반자동 입력 허용

## 프로비저닝 플로우
- [ ] Super Admin 기업 생성 시: D1 tenant 생성, build_token 발급
- [ ] Cloudflare Pages 프로젝트 자동/반자동 생성 및 환경변수 설정
- [ ] Custom Hostname(blog.고객사.com) 연결 및 Deploy Hook URL D1 저장
- [ ] 초기엔 반자동 절차라도 운영 가능하도록 문서화

## 배포/모니터링
- [ ] Deploy Hook 성공 기준 기본 success 처리, 필요 시 Pages 배포 상태 API 폴링/웹훅 검토
- [ ] 트래픽 큰 테넌트의 독립 확장 고려(프로젝트 분리)

## 품질/SEO/보안
- [ ] preview/share 링크 noindex,nofollow 적용 확인
- [ ] CMS 요청 시 session tenant와 리소스 tenant 일치 검증
- [ ] 이미지 업로드 시 브라우저 WebP 변환/압축 후 R2 업로드(presign/검증)

## 운영 우선순위(실행 체크리스트 순서)
- [ ] D1 스키마 v1.1 확정 및 시드(tenant/user)
- [ ] Worker 핵심 기능 구현(인증, posts, deploy_jobs, build endpoints)
- [ ] CMS 핵심 UX 구현(autosave, preview, publish 상태 표시, print)
- [ ] Blog 템플릿 페이지/페이지네이션/SEO 산출물 구현
- [ ] PR 모듈 초기 화면(캠페인, mentions, reports) 구현

## 영역별 개발 분담 체크리스트(충돌 방지 원칙 포함)
- [ ] **공통 원칙**: 모든 영역은 `read.md` 계약면을 변경 없이 준수. 슬러그 정책·예약어·빌드 토큰·noindex 규칙을 공유 규칙으로 재검증.
- [ ] **DB/스키마 담당(GPT-DB)**: D1 스키마 정의/마이그레이션/시드만 담당. 스키마 변경 시 전 영역에 사전 공지 후 단일 PR 선머지.
- [ ] **Worker/API 담당(GPT-API)**: 인증, RBAC, posts CRUD/publish, deploy_jobs, build endpoints, scheduled publish. 스키마 변경 없이 API 계약 범위 내 구현.
- [ ] **CMS 프런트엔드 담당(GPT-CMS)**: 로그인, autosave, preview/share(noindex), publish 상태 표시, 카테고리/테마 UI, window.print. API 계약 변경 금지, 필요 시 API 담당자와 먼저 합의.
- [ ] **Blog 템플릿 담당(GPT-BLOG)**: 정적 빌드 산출물(permalink, posts/category pagination, sitemap, robots). API 응답/빌드 데이터 계약을 소비만 하고 확장/변경 금지.
- [ ] **PR 모듈 담당(GPT-PR)**: 캠페인/mentions/reports 화면 및 관련 API 소비. 스키마/계약 변경 필요 시 DB/API 담당과 단일 PR로 선반영.
- [ ] **분리 원칙**: 역할별 브랜치는 `gpt-<role>/<task>` 네이밍 사용(예: `gpt-api/auth-rbac`, `gpt-cms/autosave-ui`). 다른 영역 파일은 원칙적으로 수정 금지.
- [ ] **계약/스키마 변경 절차**: 스키마 또는 API 인터페이스 변경은 전용 브랜치/PR 1건으로 처리 후, 다른 역할 브랜치들이 rebase.
- [ ] **병합/리뷰**: 병합 전 `git fetch && git rebase <base>` 필수, Fast-forward 우선. 역할별 커밋은 기능 단위로 작게 유지하여 diff 범위를 최소화.
- [ ] **조정/의존 순서**: 스키마 → Worker API → CMS/Blog/PR UI 순서로 작업 병렬화. 공유 리소스 변경 즉시 공지(슬랙/노션 등).

## 역할별 개발 순서(권장 실행 플로우)
1) **GPT-DB**: D1 스키마/시드 확정 및 머지 → 공유 통보  
2) **GPT-API**: 확정된 스키마 기반으로 인증/RBAC, posts CRUD/publish, deploy_jobs, build endpoints, scheduled publish 구현 → API 계약 고정 후 알림  
3) **GPT-BLOG**: API 빌드 데이터 계약을 사용해 permalink/페이지네이션/sitemap/robots 정적 산출물 구현(슬러그 예약어·noindex 규칙 준수)  
4) **GPT-CMS**: API 계약 소비하여 로그인/autosave/preview(noindex)/publish 상태/카테고리·테마/print 구현. API 변경 필요 시 GPT-API와 먼저 합의 후 단일 PR로 처리  
5) **GPT-PR**: 확정된 스키마/API를 소비해 캠페인·mentions·reports 화면 구현. 스키마/계약 변경 필요 시 GPT-DB/GPT-API와 공통 PR 선반영  
6) **합류 단계**: 모든 역할 브랜치는 병합 전 `git fetch && git rebase <base>` 실행, 충돌 없는 상태에서 Fast-forward 또는 필요 시 squash 병합  
7) **후속 검증**: 공통 규칙(빌드 토큰 헤더, 슬러그 정책, noindex, 예약어 차단) 재점검 후 최종 QA
