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

## 다중 GPT 협업 및 브랜치 전략
- [ ] GPT 역할 분담을 명시: 예) `GPT-A(Worker/API)`, `GPT-B(CMS UI/UX)`, `GPT-C(Blog 템플릿/빌드)`, `GPT-D(PR 모듈/리포트)`
- [ ] 공통 베이스 브랜치 지정 후 역할별 작업 브랜치 네이밍: `gpt-<role>/<task>` (예: `gpt-worker/auth-crud`)
- [ ] 각 브랜치는 `read.md` 계약면을 소스 오브 트루스로 삼아 범위 일치 여부 체크
- [ ] 커밋 단위는 기능/문서 단위로 작게 유지하고, 역할별 변경 파일 범위를 최소화하여 충돌 예방
- [ ] 병합 전 `git fetch` + `git rebase <base>`로 최신 반영 후 CI/테스트 확인
- [ ] 스키마/타입 정의 등 공유 리소스 변경 시 슬랙/노션 등 공통 채널에 즉시 알림
- [ ] 인터페이스/계약 변경(PRD, API 스펙, DB 스키마)은 별도 단일 PR에서 먼저 병합 후 역할 브랜치들이 이를 rebase
- [ ] 종속 순서 정리: 스키마/타입 → Worker API → CMS/Blog 소비 계층 → PR 리포트 뷰
- [ ] 컨벤션 공유: 슬러그 정책·예약어·빌드 토큰 처리 등 공통 규칙을 체크리스트로 재검증
- [ ] 병합 전략: Fast-forward 우선, 필요 시 squash 병합으로 역할별 히스토리 단순화
