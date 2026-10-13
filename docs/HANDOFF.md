# PawTrip 작업 인수인계

## 공이 히어로 발도장 방향 수정 — 2026-10-12 / Codex

- 사용자 요청과 첨부 원본을 기준으로 기존 히어로 여권 발도장의 방향만 수정. AI 영상 생성/크레딧 사용 없이 로컬 픽셀 마스크 편집으로 잉크를 180도 회전, 발·얼굴에 가려지는 구간 유지. 히어로 레이아웃/캐릭터/나머지 모션 유지. 기존 Hero 시안 폐기 결정을 되돌린 작업이 아닙니다.
- `media/hero-loop.mp4`, `media/hero-loop.webm` 갱신. 원본 1440px/24fps/12.25초를 보정한 뒤 기존처럼 앞 0.5초를 제외해 960px/11.75초 무음 출력. `index.html` 영상 v2, `sw.js` v36. 원본/기존 루프 백업과 수정 고해상도 출력은 `C:\Dev\PetPassport\hero-stamp-review`에 보관. 이전 요약의 sw.js v35는 이 작업 직전 상태입니다.
- `tools/correct_hero_stamp.py`, `docs/HERO-STAMP-FIX.md`: 특정 원본의 잉크 영역 보정 도구와 재현·검수·백업 위치 기록. 웹 빌드에 보정 라이브러리 설치가 필요하지 않습니다.
- 검증: 수정 구간 프레임 시트 직접 검수, MP4/WebM 브라우저 디코딩/재생/해상도/길이 통과, 홈페이지 실제 재생 중 8.72초 도장 방향 확인, 공개 묶음 96개·diff 통과.
- 상태: 로컬과 배포 묶음 적용 완료. 이번 영상 수정 커밋·푸시·운영 배포 미실행. 아래 최신 상태 요약은 이 영상 수정 이전 운영 확인 기준입니다.

## 다음 담당자에게: 현재 상태 요약 — 2026-10-12 / Codex

이 요약을 먼저 읽고, 아래 작업별 기록은 당시의 변경·검증 이력으로 참고하세요. 아래의 ‘배포 전’·‘푸시 실패’는 각 작업 당시 상태이며 현재 상태를 의미하지 않습니다.

### 먼저 읽을 문서와 저장소

1. 공통 규칙: `C:\Dev\PetPassport\PetPassport\AGENTS.md`.
2. 현재 인수인계: 이 문서 `docs/HANDOFF.md`.
3. PawLog 작성·이전 기준: `docs/PAWLOG-WRITING-GUIDE.md` (후속 피드백 반영 완료).
4. 선택 도구인 로컬 관리자 사용법: `docs/PAWLOG.md`.
5. 게임 영역 게시 기준: `docs/GAMES-DEPLOYMENT.md` 및 `C:\Dev\Not the Vacuum\release\pawtrip-games-handoff.md`. 게임 방침 원본은 같은 release의 `privacy/index.html`.

홈페이지 저장소는 `C:\Dev\PetPassport\PetPassport`, 블로그 초안·사진은 `C:\Dev\PawTrip4u_Blog`입니다. 원본 블로그·게임 폴더를 임의 수정하지 않습니다.

### 오늘 확정된 결과와 사용자 선호

- **PawLog**: 정식 주소 `/pawlog/`, 설명 **공이와 함께, 여행도 일상도.**. 여행 외 일상도 포함합니다. `/blog/` 목록·글은 새 주소로 이동하는 정적 호환 페이지이며 query/hash를 보존합니다.
- 네이버 pawtrip 에피소드 3개 이전. 원본은 `blog-content/posts/*.json`, 사진은 `pawlog/media/`, 공개 HTML은 생성 결과입니다. 제목·본문·순서는 게시본 기준, 실제 소제목/스크린샷의 글·표는 로컬 초안과 대조합니다.
- 호텔 서류 글의 대표 사진은 수트케이스를 열고 당황한 장면, 7kg/9kg 글은 ‘이륙 후 다시 만난 공이는 바들바들 떨고 있었어요’ 장면. 첫 사진 자동 선택 금지. 대표 이미지·본문 크기·홍보 링크 등 구체적 기준은 작성 가이드에 있습니다.
- 작은 안내/표 스크린샷을 첫 글의 목록, 두 번째 글의 안내 상자 4개·실제 표로 대체. 강조된 긴 본문을 제목으로 잘못 분류한 부분 수정. 본문 17px, 실제 소제목만 h2/h3. 모바일 표는 내부 좌우 스크롤.
- PawLog 글의 ‘네이버 원문 보기’ 및 하단 PawTrip 홍보 링크/카드·My Card 홍보 버튼 제거. 일반 탐색·다른 이야기 읽기·공식 자료 링크는 유지합니다.
- **PawTrip 공식 로고를 홈페이지와 PawLog에 사용**, Games는 예외. 추천한 무료 폰트 시안은 사용자가 철회했고 파일을 삭제했으므로 다시 적용하지 않습니다.
- 사용자는 직접 관리 화면 편집보다 **네이버에 게시한 후 AI에게 PawLog 반영 요청**을 선호합니다. 자동 감시/동기화는 없습니다. `127.0.0.1:8767/admin/`은 이 PC의 선택 편집 도구이고 공개 관리자 페이지가 아닙니다. 도구 파일 `tools/blog_admin.py`, `tools/blog-admin.html`, 시작 파일 `Start-PawLog.cmd`. 초안/미게시 사진 `.blog-admin/`은 비공개·Git 제외입니다.
- **My Card**: 직접 카드 언어를 선택하지 않으면 현재 홈페이지 언어를 따르고, 명시 선택은 보존. 한국어 카드의 날짜는 한국어만 출력. 입력한 이름·메모와 기존 브라우저/사진 저장소 보존. 현재 features.js v14, medical-card.js v4, nav.js v8, sw.js v35.
- **Games**: 목록·소개·게임 방침·루트 app-ads.txt 독립 유지. Tori 표기·모바일 얼굴 잘림 수정. 방침은 20:45 수정본(광고 사전 로딩 설명 포함), #ko/#en과 양 언어·원문 보존, 분석/추적 스크립트 없음. 여행 메뉴에 Games 링크는 출시 후 추가하기로 확정.
- **Apple Wallet**: Developer 계정 승인 대기, 실제 인증서/서버/아이폰 검증 전에는 준비 중 유지. 비밀키·인증서를 공개 폴더나 Git에 넣지 않습니다.

### 현재 Git·운영 반영과 검증 범위

- 이 요약을 작성하기 직전 작업 폴더는 깨끗했고, main HEAD **7bf98d9**와 origin/main의 차이는 **0/0**이었습니다. 사용자의 커밋·푸시로 앞선 페이지 작업과 My Card 언어 수정이 GitHub에 반영된 상태입니다.
- 이번 읽기 전용 운영 확인: `https://pawtrip.us/pawlog/`, `/features.js`, `/medical-card.js`는 모두 HTTP 200이며 로컬 파일과 줄바꿈 정규화 후 동일합니다. 이 세 파일의 운영 반영을 확인했으며 모든 페이지/기기의 재검증으로 확대 해석하지 않습니다.
- 최근 검증: Python 12개, 공개 묶음 96개 검사, PawLog PC/모바일·이전 주소 이동·별도 임시 저장소 관리자 게시 흐름, 홈페이지 4언어·My Card PNG/공유/인쇄/오프라인 회귀 통과. 사용자 개인 저장소는 테스트하지 않았습니다.
- 이번 **최신 상태 요약 자체는 새 로컬 문서 변경**입니다. 이후 커밋·푸시 전에는 원격에서 이 추가 요약을 볼 수 없습니다. 같은 PC의 Claude는 이 로컬 파일을 바로 읽을 수 있습니다.

### 이어서 작업할 때

- 매번 git status·원격 차이를 확인하고 기존 로컬 변경을 보존합니다. 클로드의 작업 디렉터리를 홈페이지 저장소로 지정합니다.
- PawLog 반영 요청 시 작성 가이드를 먼저 읽고 글 원본 JSON을 수정한 뒤 `python tools/build_pages.py`, 변경에 맞는 테스트, `python tools/prepare_site.py`, `python tools/check_release.py`로 배포 묶음을 생성합니다. 생성 HTML만 고치지 않습니다.
- 실제 휴대폰의 PNG 저장·카카오톡 첨부·카드 언어는 사용자의 기기 확인이 필요합니다. 영문 카드 선호가 이미 저장된 기기는 카드 화면의 한국어 버튼으로 바꿀 수 있습니다.
- 현재 별도로 승인된 새 개발 작업은 없습니다. 자동 예약·새 AI 채팅·클로드 메시지를 임의로 만들거나 보내지 않았습니다.

## My Card 기본 언어·수정일 표시 수정 — 2026-10-12 / Codex

- 사용자 보고: 한국어 홈페이지에서 만든 카드가 영어로 출력. 첨부 PNG 본문은 한국어지만 수정일에는 영문/일문/한글이 혼합돼 있음. `features.js`의 pt-sos-lang 미선택 기본값 en과 `medical-card.js`의 고정 다국어 날짜 문구 확인.
- `features.js`: 카드 언어를 직접 선택한 기록이 있으면 유지하고, 없으면 현재 홈페이지 언어(PTLanguage/pt-ui-language)를 사용, 최종 기본값 ko. 기존 다국어 진료용 카드도 같은 기본값 사용. `medical-card.js`: 미리보기를 열 때 기본 언어를 다시 읽어 작성 중 홈페이지 언어 변경도 반영, 날짜 문구를 선택 언어로만 출력. My Card 서비스 명칭과 직접 작성한 이름·메모는 보존.
- 캐시 갱신: features.js v14, medical-card.js v4, sw.js v35. 페이지 생성·공개 묶음 갱신.
- `tools/test_site_language.cjs`: 명시 카드 언어 선택 전 4개 홈페이지 언어 추종·선택 기록 임의 생성 없음 추가. `tools/test_medical_card.cjs`: 한국어 기본 카드/수정일 확인 추가.
- 검증: 사이트 4언어·독립 카드 언어 유지·입력 보존·PNG 4언어·공유/인쇄·모바일·기존 SOS·오프라인 회귀 통과. Python 12개·공개 묶음 96개·diff 통과. 테스트는 격리 브라우저에서 수행해 사용자 카드 저장소 변경 없음.
- 상태: 로컬/배포 준비 묶음 완료, 이번 수정 커밋·푸시·운영 배포 미실행. 기존에 영어 카드를 직접 선택한 기기에서는 카드 화면의 한국어 버튼으로 변경할 수 있습니다.

## PawLog 주소·설명 변경 — 2026-10-12 / Codex

- 사용자 선택: 설명 ‘공이와 함께, 여행도 일상도.’, 정식 주소 `/blog/` 대신 `/pawlog/`로 변경.
- 공개 폴더를 `pawlog/`로 이동, 목록·3개 글·사진·CSS·메뉴·canonical/og:image·검색·사이트맵과 관리자 업로드/게시/미리보기 경로 변경. 글 slug는 유지. 글 원본 JSON·manifest와 저장된 초안 경로도 변경 대상에 포함했습니다. 내부 도구 이름과 비공개 `blog-content/` 폴더는 그대로 유지.
- `tools/blog_core.py`: `/blog/` 목록·기존 3개 글에 정식 canonical/noindex·자동 이동·수동 링크를 갖춘 호환 페이지 생성. 자동 이동은 query/hash 유지. GitHub Pages 정적 HTML 방식이며 HTTP 301 응답은 아닙니다. 관리자 서버에서는 기존 페이지 경로 302 이동 지원.
- `tools/prepare_site.py`는 새 PawLog와 기존 호환 페이지를 모두 포함. `nav.js` v8 참조, `sw.js` v34는 기존/신규 경로를 네트워크로 처리. `AGENTS.md`·작성 가이드·사용 문서에 새 주소와 설명 반영.
- 검증: Python 12개·공개 묶음 96개·PC/모바일 1440·390·320px 글/그림/문구/메뉴 확인. 임시 저장소에서 관리자 업로드→초안→복원→미리보기→게시·수정 통과. 기존 4개 주소의 query/hash 유지 이동·canonical과 실제 관리자 API 확인, diff 통과. 테스트 글은 실제 저장소에 게시하지 않음.
- 상태: 로컬/배포 준비 묶음 완료, 8767 관리자 새 경로 기준으로 재시작. 이번 변경 커밋·푸시·운영 배포 미실행.

## PawLog 작성 가이드·업데이트 방식 정리 — 2026-10-12 / Codex

- 사용자 요청: 로컬 관리 화면 위치 설명, 직접 편집 대신 네이버 작성 후 AI에게 PawLog 업데이트 요청, 오늘 피드백을 작성 가이드로 정리.
- `docs/PAWLOG-WRITING-GUIDE.md`: 이름/설명, 게시본·초안 우선순위, 소제목과 본문 강조, 스크린샷의 텍스트/표 대체, 네이버 대표 이미지·확정 장면, 공식 로고/Games 예외, 원문/홍보 링크 제외, 모바일 검수, 배포 단계, 다음 요청 문구 기록.
- `AGENTS.md`: PawLog 작업 전 가이드 필수 확인. `docs/PAWLOG.md`: AI 요청 방식이 기본이며 로컬 관리자 사용은 선택 도구임을 설명. 자동 감시/자동 동기화는 설정하지 않았습니다. 관리 프로그램은 삭제하지 않음.
- 상태: 문서만 로컬 저장, diff 검사 통과. 기존 페이지·사용자 초안·배포 파일에 변경 없음. 커밋·푸시·운영 배포 미실행.

## PawLog 소제목·본문 강조 크기 수정 — 2026-10-12 / Codex

- 사용자 보고: 실제 소제목보다 강조된 본문 문장이 크게 표시. 네이버에서 가져올 때 글자 크기/굵기로 제목을 추정한 분류 오류를 원본 초안의 h2/h3 구조와 대조해 수정했습니다.
- 세 글 원본 JSON의 문단 태그만 정리: 첫 글 6곳, 두 번째 글 21곳. 실제 제목은 첫 글 h2 4개·두 번째 h2 7개·세 번째 h2 8개/h3 10개. 세 번째 글은 이미 초안과 일치해 본문 태그 변경 없음. ‘그 순간 머릿속에 떠오른 장면 하나…’ 등 본문은 p로 복원해 17px, 강조 b는 유지. 글의 문장·강조·이미지·대표 사진은 보존.
- 검증: 수정 전후 모든 글의 본문 텍스트 동일, 초안 소제목 일치. 공개 묶음 92개·PC 1440px/모바일 390·320px 제목 개수·제목이 본문보다 큼·보고한 문장의 본문 크기/굵기·가로 넘침 없음 확인. diff 통과.
- 상태: 로컬/배포 준비 묶음 갱신. 커밋·푸시·운영 배포 미실행.

## 미국 여행 준비 글 스크린샷·글 하단 홍보 링크 정리 — 2026-10-12 / Codex

- 사용자 보고: 두 번째 글의 스크린샷도 작게 표시. 원본 `PawTrip_두번째글.html`의 안내 상자 4개와 서류 체크리스트 표를 그대로 옮겨 다섯 스크린샷(사진 번호 2·3·5·6·8)을 대체했습니다. 본문 여행 삽화 3개는 유지, 미사용 PNG 삭제, manifest에 대체 내역 기록. 원본 폴더 수정 없음.
- `tools/blog_core.py`, `blog/blog.css`: note-box/table-wrap 클래스만 허용해 편집·재게시에서도 안내/표 스타일 유지. CSS v3. 모바일 표는 내부 가로 스크롤과 안내 문구로 4개 열을 읽을 수 있게 구성했습니다. 문장·규정은 초안에서 그대로 복사했고 새 규정 검증으로 간주하지 않습니다.
- 사용자 후속 요청: PawLog 글 하단의 PawTrip 홍보 링크 불필요. 3개 글 본문의 홈 링크 카드/빈 링크와 공통 하단 My Card 홍보 버튼 제거. 다른 글 읽기와 일반 사이트 탐색 메뉴는 유지합니다.
- 검증: Python 12개·공개 묶음 92개·PC 1440px/모바일 390·320px 안내 상자 4개·서류 표 6행·삽화 3개·페이지 가로 넘침 없음 확인. 세 글의 하단 홍보 링크 제거 확인. 모바일 표 스크린샷 검수, diff 통과.
- 상태: 로컬/배포 준비 묶음 갱신 완료. 커밋·푸시·운영 배포 미실행.

## PawLog 대표 이미지 지정 — 2026-10-12 / Codex

- 사용자 요청대로 호텔 서류 에피소드의 대표 사진은 수트케이스를 열고 당황한 장면(`gong-us-hotel-documents-3.jpg`), 7kg/9kg 에피소드는 ‘이륙 후 다시 만난 공이는 바들바들 떨고 있었어요’ 장면(`gong-cabin-airline-experience-4.png`)으로 지정했습니다. 기존 사진을 직접 확인 후 글 원본 JSON의 cover만 변경했습니다.
- 공개 목록과 두 글의 공유 미리보기(og:image)·배포 묶음 재생성. 본문 사진 순서 유지. PC/모바일에서 대표 이미지 경로·로드·가로 넘침 확인, 공개 파일 검사 통과.
- 상태: 로컬 반영 완료. 커밋·푸시·운영 배포 미실행.

## PawLog 로고·작은 스크린샷·원문 링크 수정 — 2026-10-12 / Codex

- 사용자 지시: Games를 제외한 PawTrip 홈페이지에서 항상 기존 PawTrip 로고 사용. `AGENTS.md`에 규칙 기록. PawLog 목록·3개 글·관리 화면에 밝은 배경용 `media/logo-light.svg` 적용, CSS v2. 기존 여행 페이지는 이미 로고를 사용하며 Games는 유지. 로컬 관리 서버에서도 지정된 로고 파일을 제공하도록 수정.
- 첫 에피소드의 ‘그날 배운 것’ 아래 작은 스크린샷을 원본 초안의 제목과 세 항목 목록으로 대체. 문장은 초안 그대로 사용. 사용하지 않는 `gong-us-hotel-documents-5.png` 삭제, 이전 manifest에 텍스트 대체 내역 기록.
- 사용자 후속 요청에 따라 모든 PawLog 글의 ‘네이버 원문 보기 ↗’ 표시 제거. 원문 주소는 글 원본과 이전 기록에만 보존합니다.
- 검증: Python 12개·공개 묶음 97개·320/390/1440px 모든 PawLog 페이지 가로 넘침 없음, 공식 로고 로드, 관리자 로고 로드, 목록 3항목·스크린샷/원문 링크 제거 확인. diff 통과. Games 파일 수정 없음.
- 상태: 로컬/배포 준비 묶음 갱신. 커밋·푸시·운영 배포 미실행.

## PawLog 글 이전·로컬 관리 화면 — 2026-10-12 / Codex

- 사용자 요청: 네이버 pawtrip의 기존 에피소드 3개 이전과 사진 업로드→작성→미리보기→게시 관리 화면. 사용자 선택: 이 PC에서 관리하고 GitHub Desktop으로 커밋·Push origin. 메뉴 이름 PawLog, 설명은 후속 요청대로 **공이와 함께 한 시간들**. 여행 외 일상도 작성 가능.
- 네이버 RSS와 각 공개 PostView의 게시본 기준으로 제목·날짜·본문·강조·표·사진 순서 이전. 로컬 `C:\Dev\PawTrip4u_Blog`의 AGENTS 확인, 원본 초안·이미지는 수정하지 않음. 19개 사진 중 파일명이 일치하는 것은 로컬 복사, 네이버 추가 이미지(표·링크 카드 이미지 등)는 게시본에서 복사. 원문 링크·사진 출처는 `blog-content/import-manifest.json` 기록. 링크 카드 디자인은 일반 링크로 정리.
- `blog-content/posts/*.json`, `blog/media/`, `blog/`: 3개 글 원본·사진·PawLog 목록과 개별 페이지. 게시본의 비어 있지 않은 본문/표/사진 설명 문단 160개가 이전 본문에 모두 포함되는지 대조 완료. 그림 자르지 않고 전체 표시. 원문과 이후 자동 동기화는 하지 않음.
- `tools/blog_core.py`, `tools/build_pages.py`: 공개 페이지 생성과 검색/사이트맵 연동. `nav.js`: 내 반려견 메뉴에 PawLog 추가, 관련 HTML의 nav.js v7. `sw.js` v33: 블로그는 네트워크 사용. `tools/prepare_site.py`, `tools/check_release.py`: 공개 blog 포함, 관리 도구·초안·글 원본 JSON 제외.
- `tools/blog_admin.py`, `tools/blog-admin.html`, `Start-PawLog.cmd`: 127.0.0.1:8767의 로컬 관리자. 기존 글 수정, 사진 업로드/대표 사진/순서/설명/삭제, 기본 서식, 초안 저장·복원, iframe 미리보기, 공개 파일 게시·검색/사이트맵 갱신. 게시 이후 GitHub Desktop 커밋→Push origin을 안내하며 즉시 운영 게시로 표시하지 않음. 글 주소 충돌·동시 수정 방지, CSRF·Host/Origin 검증, HTML 허용 목록, 경로/업로드 제한. `.blog-admin/` 미게시 초안·사진은 Git·공개 묶음 제외. 공개 홈페이지에는 관리자 링크를 넣지 않음.
- `docs/PAWLOG.md`: 실행·작성·게시·백업 절차. 관리 서버 실행 창을 닫으면 종료. 인터넷 관리자 로그인/휴대폰 게시 서버는 이번 범위 아님(사용자가 PC 방식 선택).
- 검증: Python 12개, 공개 묶음 98개, PawLog 1440/390/320px 3개 글/전체 사진 로드·가로 넘침 없음·My Card 메뉴 링크, 별도 임시 저장소에서 업로드→초안 저장→새로고침 복원→미리보기→게시→기존 글 수정, 사진 설명/위치 변경, 동시 수정/CSRF/경로 보호 검사 통과. 게임 방침 #ko/#en 회귀·diff 검사 통과. 모바일 목록·글·관리 화면 스크린샷 검수.
- 상태: 로컬 개발·배포 준비 묶음 완료, 현재 8767 관리자 실행 중. 이번 PawLog 변경 커밋·푸시·운영 배포 미실행. 이전 방침 수정 커밋은 현재 origin과 일치함(fetch 확인). 관리 기능 테스트용 글은 별도 임시 저장소에서만 작성해 실제 글 목록에 없음.

## 게임 개인정보처리방침 20:45 수정본 재게시 — 2026-10-12 / Codex

- 사용자 요청: 제공한 방침 수정본으로 교체·재게시, #ko/#en 유지, Tory→Tori 함께 확인. 지시서 4-1절의 20:45 개정 내용 확인.
- games/not-the-vacuum/privacy/index.html: 제공된 최종 HTML을 바이트 단위 그대로 복사. 광고 사전 로딩과 미시청 시 Google 정보 처리, 광고 동의 설정, 국외 이전 시기·목적의 수정 문구 반영. 날짜·양 언어·앵커 유지, 스크립트 없음.
- tools/test_games.py: 승인된 수정본의 LF 정규화 SHA-256을 080d7671e73da38d5813c6b1e20c1c782a99556e5d39aec88e369fe33b327d5c로 갱신. 목록·소개 alt와 소개 이름 줄의 Tori 표기는 기존 HEAD에서 이미 맞게 적용되어 추가 변경 불필요.
- 검증: Python 9개·공개 묶음 74개·브라우저 PC/모바일 #ko/#en 및 SW/격리 컨텍스트 검사 통과. 제공 원본과 바이트 일치. 철회한 폰트는 포함하지 않음.
- 배포: main에 수정 커밋 완료. git push는 Git Credential Manager 인증 대기 후 중단했고, 저장된 인증을 이용한 재시도도 사용자 이름 인증 부재로 실패했습니다. 원격 main은 3064fb2 그대로이며 운영 재게시는 아직 미완료. GitHub Desktop에서 Push origin 또는 GitHub 인증 완료 후 푸시 필요. 게시 후 #ko/#en·원문 일치 확인 필요.


## 게임 폰트 시안 철회·정리 — 2026-10-12 / Codex

- 사용자 요청에 따라 게임 목록·소개 CSS와 HTML, 폰트용 검사 변경을 적용 전 상태로 복원했습니다. 기존 모바일 그림 잘림 수정과 Tori 표기는 유지합니다.
- 사용하지 않는 games/fonts/의 폰트·라이선스·README를 삭제하고 공개 배포 묶음도 원래 폰트로 다시 생성했습니다.
- 검증: 공개 파일 검사·게임 브라우저 검사·diff 검사 통과. 게임 파일은 폰트 적용 전 HEAD와 동일합니다.
- 상태: 폰트 시안은 배포하지 않음. 이번 정리는 로컬 반영이며 커밋·푸시·운영 배포 미실행.

## 게임 모바일 그림 잘림·Tori 표기 수정 — 2026-10-12 / Codex

- 사용자 보고: 모바일 게임 목록에서 오른쪽 구름 얼굴과 로고가 잘림. 후속 요청: 소개의 `토리 · Tory`와 목록/소개 이미지 alt의 `토리 / Tory`를 Tori로 변경.
- `games/games.css`: Grid의 자동 최소 폭으로 큰 PNG가 카드 내부를 넓히는 문제 수정. minmax(0,1fr) 트랙·자식 min-width:0·로고 width:100%·세 강아지 균등 Grid로 카드 내부에 전체 그림이 들어오도록 구성. 이미지 자체/원본은 수정하지 않았습니다.
- `games/index.html`, `games/not-the-vacuum/index.html`: CSS v2 캐시 갱신, 요청한 이름과 alt를 Tori로 수정. 자산 파일명 tory.png는 기존 파일 경로 그대로 유지.
- `tools/test_games_browser.cjs`: 게임 화면은 320·390·430·1440px에서 확인하고, 전체 페이지 가로 넘침 외에 각 그림 경계가 카드 안에 모두 들어오는지 검사 추가. 승인된 정책 원본은 변경하지 않았으며 해당 정책의 가로 폭 검사는 기존 390px 이상 범위를 유지합니다.
- 검증: 게임 브라우저·Python 9개·공개 묶음 74개 검사·diff 통과. 390px 게임 목록 스크린샷에서 세 얼굴과 로고 전체 표시 직접 확인. 로컬/배포 준비 파일 갱신 완료, 이번 수정 커밋·푸시·운영 배포 미실행.

## 게임 영역 작업 — 2026-10-12 / Codex

- 사용자 요청: 지시서 `C:\Dev\Not the Vacuum\release\pawtrip-games-handoff.md` 20:05 개정본과 `privacy/index.html` 최종본을 확인한 뒤 네 독립 URL 제작. 게임 메뉴 링크는 출시 후 추가하도록 사용자 답변 받았습니다. 원본 게임 폴더는 읽기와 그림 복사만 수행했습니다.
- `games/index.html`, `games/not-the-vacuum/index.html`, `games/games.css`, `games/assets/`: 독립 게임 목록과 한국어·영어 소개·지원. 승인된 소개 문장 그대로 사용, 다른 게임 언급/광고 없는 약속/어린이용 표현 없음. 실제 제공된 앱 아이콘·타이틀 로고와 보리/토리/구름 calm PNG 복사, 스토어는 곧 출시 표시이며 깨진 다운로드 링크 없음. 연락처 help@pawtrip.us.
- `games/not-the-vacuum/privacy/index.html`: 제공된 최종 HTML 그대로 복사. 정규화 SHA-256 `c1f3b07d4b91df5cb41773b33078bafa9f878fb4fd08e64aece1d5a1b3f40764`, 원본 일치. `id="ko"`·`id="en"`, 두 언어·날짜·본문 유지, 어떤 스크립트도 추가하지 않음. 여행 방침 privacy.html 유지.
- `app-ads.txt`: 루트에 지정된 한 줄, ASCII 호환 UTF-8/BOM 없음. 사용자가 지시서에 확정한 AdMob pub ID 사용, AdMob 콘솔의 해당 줄을 직접 확인한 것은 아님.
- `tools/prepare_site.py`, `tools/check_release.py`: games 전체와 app-ads를 공개 묶음에 포함하고 필수 파일·광고 텍스트·앵커/스크립트 제외를 검증. `tools/build_pages.py`, `sitemap.xml`: 게임 URL 3개 추가, 기존 검색 색인과 여행 페이지 생성 유지. `sw.js` v32: games와 app-ads를 처리하지 않도록 제외. 여행 메뉴 nav.js와 홈페이지는 변경하지 않음.
- 검증: Python 9개·공개 파일 검사·게임 브라우저 검증 통과. 로컬 네 URL HTTP 200/무리디렉션, app-ads text/plain/한 줄 정확성, PC 1440px·모바일 390px의 정책 #ko/#en 진입과 두 번 새로고침, 기존 SW 제어 브라우저와 새 격리 컨텍스트, 양 언어 표시/정책 스크립트 없음, 게임 그림 로드·가로 넘침 없음, 게임 파일 SW 캐시 없음 확인. 게임 소개 PC/모바일 스크린샷 직접 검수. 여행 방침·메뉴·규정·홈페이지는 HEAD와 동일.
- 상태: 로컬 페이지와 공개 배포 묶음 준비 완료. Git 커밋·푸시·운영 배포 미실행. 실제 휴대폰과 운영 URL 200/앵커/MIME·AdMob 콘솔 검증은 배포 후 확인해야 합니다. 운영 주소 4개 및 절차는 `docs/GAMES-DEPLOYMENT.md`. 배포 커밋 ID는 아직 없습니다.

## 운영 배포 확인 — 2026-10-12 / Codex

- 사용자가 홈페이지 배포 완료를 알렸습니다. 로컬 작업 폴더는 깨끗한 상태였습니다.
- 운영 `https://pawtrip.us/mycard/`와 features.js/css, medical-card.js, trip-plan.js, site-language.js, wallet-config.js, sw.js의 GET 응답 8개가 모두 HTTP 200이며 로컬 최신 파일과 줄바꿈 정규화 후 일치했습니다. 카드·견종/중성화·상단 언어·일정 연동·개인정보 안내의 최신 코드가 운영에 반영됐습니다.
- Wallet endpoint는 현재 빈 값으로 준비 중 유지. 이번 확인에서는 운영 사용자 입력이나 공유/분석 이벤트를 발생시키지 않았습니다. 실제 휴대폰 저장·공유와 운영 GA 이벤트 수신은 별도 확인 항목입니다.
- 상태: 사용자가 운영 배포 완료, Codex는 공개 파일 반영을 읽기 전용으로 확인. 이 인수인계 기록 추가는 새 로컬 변경이며 아직 커밋·푸시하지 않았습니다. 아래 과거 기록의 배포 전 상태는 각 작업 당시 기준입니다.

## 일정 계산기와 My Card 연결 — 2026-10-12 / Codex

- 사용자가 같은 채팅에서 이어서 진행을 허용해 기존 일정 계산기를 My Card에 연결했습니다. 새 채팅은 만들지 않았습니다.
- `trip-plan.js`: 기존 일정 계산기의 earliest 계산을 공통 함수로 추출. 국가별 기존 대기기간·leadDays·날짜 계산 그대로 재사용하며 My Card가 별도 규정 계산을 만들지 않게 했습니다. 달력 날짜 검증·날짜 차이는 DST에 영향받지 않는 달력일 기준. 기존 규정 데이터는 변경하지 않았습니다.
- `features.js`: 기존 준비 현황에 목적지·희망 출국일, D-day, 체크 진행률, 첫 미완료 요건, 가장 가까운 기존 timeline 일정, 전체 일정 보기·수정 링크 추가. 목적지/날짜는 기존 `pp3`에 저장하며 계산기와 양방향 공유합니다. 다른 필드는 merge하여 보존, 국가별 체크는 기존 `pp3c-*` 유지. 다른 탭의 `pp3` 변경도 다시 읽습니다.
- 체크 완료가 날짜 요건 충족/입국 허가를 의미하지 않음을 표시합니다. 희망 출국일까지 기존 계산기 추정 준비기간이 부족하면 경고와 추정 가장 빠른 날을 표시합니다. 가까운 일정은 미완료 체크와 자동 연결된 마감이 아니라 기존 timeline 권장 시점이며 이를 구분해 안내합니다. 날짜 미입력/과거 출국일/전체 체크 완료도 처리합니다.
- `index.html`, 생성 My Card 스크립트·공개 묶음·서비스 워커: 공통 날짜 스크립트 포함. features v13·CSS v9·site-language v2·trip-plan v1, 캐시 v31. 새 요약 제목과 주요 안내의 4개 UI 언어 번역 추가.
- 검증: Python 6개, 새 일정/브라우저 검증(달력 경계·입력/삭제·D-day·진행률·양방향 계산기 연동·국가별 기록 보존·준비 기간 부족·전체 체크 완료·모바일), 기존 카드·언어·Wallet 브라우저 통과. 모바일 요약 화면 직접 검수. 공개 파일 검사 64개·diff 확인 통과.
- 상태: 로컬 개발 완료, 운영 배포 없음. 배포 준비를 최신 요약까지 갱신한 ZIP은 `C:\Dev\PetPassport\releases\pawtrip-mycard-2026-10-12-4.zip`입니다. 기존 ZIP은 이 일정 연동 기능 추가 전입니다.

## 홈페이지 상단 언어 선택 — 2026-10-12 / Codex

- 사용자 요청과 답변: 상단 언어 선택 추가, 한국어·영어·일본어·중국어, 메뉴·My Card·주요 안내부터 적용.
- `site-language.js`: 로컬 번역 문구로 공통 메뉴·Hero 주요 안내·My Card 작성/저장/개인정보 안내를 전환. `pt-ui-language`로 선택을 보존하며 화면 이동·새로고침·동적 양식에서도 유지. 브라우저의 표시 텍스트와 안내 속성만 변경하고 입력값/선택값/저장 데이터는 변경하지 않습니다. implicit option value도 원문으로 고정합니다. 이름·의료 카드·기존 SOS·문서 이름·직접 입력 내용은 번역 대상에서 제외합니다. 진료용 카드 출력 언어는 별도로 유지합니다. 외부 자동 번역 요청 없음.
- 범위: 국가·항공사 규정과 다른 안내 글 본문은 한국어 원문 유지, 비한국어 선택 시 상단에 이를 안내합니다. 본문 전체 번역으로 표시하지 않습니다.
- `features.css`: 모바일 상단 언어 드롭다운, PC 상단 바 표시 및 메뉴 기존 배치 유지. `features.js`: 기존 선택형 의료 항목 번역 사전 재사용. `index.html`, `tools/build_pages.py`, `privacy.html`: 공통 스크립트 연결. CSS v8·features v12·site-language v1, 서비스 워커 v30·공개 파일 준비에 포함.
- 검증: 기존 Python 6개·카드/Wallet 브라우저 회귀 통과. `tools/test_site_language.cjs`에서 네 언어·새로고침·페이지 이동·입력 중 값 보존·canonical option value·독립 카드 언어·한국어 복원·개인정보가 외부 번역으로 전송되지 않음·PC 상단 표시·390px 모바일 넘침 없음 확인. 모바일·PC 화면을 캡처하고 모바일 화면 직접 검수. 공개 묶음 검사 63개 파일 통과.
- 배포 준비: 최신 언어 기능을 포함한 ZIP은 `C:\Dev\PetPassport\releases\pawtrip-mycard-2026-10-12-3.zip`. 기존 ZIP은 언어 메뉴 추가 전 버전입니다. 로컬 저장 완료, 커밋·푸시·운영 배포 없음.

## 견종 선택·성별·중성화 — 2026-10-12 / Codex

- 사용자 요청: 견종 드롭다운, 간단 작성의 중성화 입력, 영어 암컷/수컷 중성화 용어 구분.
- `features.js`, `medical-card.js`: 간단·상세 양식 모두 29개 견종 드롭다운과 기타 직접 입력 제공. 기존 목록 밖 견종을 직접 입력값으로 보존하며 알려진 견종은 외국어 카드에 영문명/한국어명 병기. 성별과 중성화 완료/안 함/미입력 선택 추가. 기존 `neut:true`는 완료로 읽고 기존 false 또는 누락은 안 함으로 단정하지 않고 미입력으로 읽습니다. `neutStatus`와 기존 호환 boolean `neut`를 함께 저장합니다.
- 출력: 미리보기·PNG·인쇄·기존 SOS·Wallet 상세 데이터에 성별/중성화 반영. 영어 Female · Spayed, Male · Neutered, 중성화 안 함은 Intact, 미입력은 not provided. 일본어 완료 표현도 성별에 맞게 避妊済み/去勢済み 사용. 직접 입력한 미등록 견종은 원문 유지.
- `wallet-service/pass.js`: 상세 필드에 성별/중성화 추가. 공개 스크립트 features v11·medical-card v3 연결과 페이지 재생성. 기존 개인정보 전송 동의 범위를 넘는 정보는 추가하지 않았습니다.
- 검증: Python 6개·카드 및 Wallet 브라우저·서버 3개·공개 파일 검사·diff 통과. 브라우저 검증에 직접 견종 보존, legacy 미입력, 암컷 Spayed, 상세 편집 후 수컷 Neutered, Intact 표시를 추가 확인. PNG 직접 시각 검수.
- 배포 준비 갱신: 최신 공개 ZIP `C:\Dev\PetPassport\releases\pawtrip-mycard-2026-10-12-2.zip`와 manifest 생성. 이전 접미사 없는 ZIP은 이번 견종/중성화 수정 전 버전입니다. 로컬 저장 완료, 커밋·푸시·운영 배포 없음.

## 외부 배포 준비 — 2026-10-12 / Codex

- 사용자 요청: 외부 배포 준비. 기존 로컬 변경을 유지하고 `git fetch origin` 후 HEAD와 origin/main의 차이 0/0을 확인했습니다. 실제 푸시·배포는 요청 범위에 포함하지 않고 준비 상태로 남겼습니다.
- `tools/check_release.py`, `.github/workflows/pages.yml`: Pages 업로드 전 공개 파일·HTML 내부 참조·필수 스크립트·CNAME·규정 일치 검증. Wallet 서버·도구·문서·비밀 파일이 공개 묶음에 들어가지 않도록 확인합니다. 이번 릴리스는 wallet-config endpoint가 빈 값인지도 검사합니다. 향후 Wallet 활성화 시 이 준비 중 검사를 해당 릴리스 조건에 맞춰 변경해야 합니다.
- `docs/DEPLOYMENT.md`: 이번 배포 내용·GitHub Desktop Commit/Push 절차·Actions/브랜치 배포 구분·배포 후 확인·되돌리기 안내. 현재 GitHub Pages Source 설정은 조회·변경하지 않았습니다.
- 검증: Python 6개, Wallet 서버 Node 3개, 카드와 Wallet 브라우저 검증 통과. `_site`를 별도 로컬 서버로 열어 같은 브라우저 검증을 추가 실행했습니다. 공개 파일 62개·생성 페이지 27개·검색 항목 169개. 카드 기록 보존·네 언어 PNG·모바일·오프라인과 Wallet 준비 중 상태 확인, diff 검사 성공. data.json·Hero 미디어는 HEAD와 동일합니다.
- 결과물: `_site/` 공개 배포 묶음과 저장소 밖 `C:\Dev\PetPassport\releases\pawtrip-mycard-2026-10-12.zip`, 해당 `.manifest.json`. ZIP의 CRC 및 파일별 SHA-256을 공개 묶음과 비교해 일치 확인했습니다. ZIP에는 서버 코드·개인 기록·인증서를 포함하지 않습니다.
- 상태: 로컬 파일·공개 묶음·ZIP 준비 완료. Git 커밋·원격 푸시·운영 배포는 수행하지 않았습니다. 실제 아이폰/안드로이드의 공유·사진첩·PDF 저장 최종 확인과 Apple Wallet의 실제 인증서/서버/아이폰 설치는 기존 미검증 항목입니다.

## My Card 상단 개인정보 안내 — 2026-10-12 / Codex

- 사용자 요청: My Card 진입 시 기기 보관 안내를 친절하고 눈에 띄는 위치에 표시.
- `features.js`, `features.css`: 페이지 제목 바로 아래에 방패 아이콘·연한 초록 안내 박스 추가. “입력한 정보는 이 기기에 보관돼요”, 반려견 정보·사진·서류의 브라우저 저장과 기본 작성 시 서버 전송/다른 사용자 공개 없음 안내. 직접 공유·Wallet 동의 발급 시 외부 전달 예외와 개인정보 상세 링크도 표시. 관리 화면과 상세 편집 화면에 공통 적용. 하단은 백업·기기 변경 안내로 정리.
- `tools/rule_pages.py`: JavaScript 실행 전 정적 My Card에도 같은 안내 제공. 생성기·홈페이지에서 features JS v10·CSS v7로 갱신. 페이지 재생성·검색 색인 169개·공개 파일 준비 완료.
- 검증: 기존 Python 6개·JS 구문·diff 검사 통과. 별도 브라우저에서 모바일 390px의 관리·편집 화면 모두 첫 화면 내 안내 노출과 가로 넘침 없음 확인, 화면 직접 검수. 기존 카드·Wallet 로직 변경 없음.
- 상태: 로컬 저장 완료, 커밋·푸시·운영 배포 없음.

## Apple Wallet 개발 — 2026-10-12 / Codex

- 사용자 요청: Wallet 지원을 지금 개발. 사용자 Apple Developer Program 가입은 승인 대기 중입니다. 코드와 연결 절차를 준비하되 실제 Apple 인증서·서버 배포·아이폰 설치 검증은 아직 수행할 수 없습니다.
- `wallet-service/`: 독립 Node 발급 서버와 선택적 Node serverless adapter. `passkit-generator` 3.6.1·`pngjs` 7.0.0 고정 의존성과 pnpm lockfile. 기존 PawTrip 아이콘을 재사용했습니다. 환경변수 인증서 로드, UID·Team ID·기간·발급자 서명·비밀키 일치 확인, 입력·사진 크기 검증, origin 제한, 요청 제한, `no-store` 응답, 로그/DB/파일에 개인 정보를 저장하지 않는 메모리 내 발급.
- 패스: generic 카드, 앞면 이름·체중·전화·지병·알레르기, 상세 정보·약·생성일·원문 안내, 사진 thumbnail. 서류 원본과 규정 데이터를 전송하지 않습니다. 자동 갱신·공개 QR·서버 프로필 저장은 없습니다. 무작위 새 serialNumber로 발급하므로 재발급은 새 카드이며 이전 카드는 이용자가 정리합니다.
- `wallet-config.js`, `medical-card.js`, `features.js`: 현재 endpoint는 빈 값이며 Wallet 버튼은 준비 중입니다. 연결 후 버튼 → 정보 전송 동의 → POST 발급 → `.pkpass` 파일 열기. 전송 정보는 미리보기에 표시할 항목과 180px PNG 사진뿐입니다. 실패 시 PNG 저장 대체 경로 유지, GA에는 언어·행동만 기록.
- `privacy.html`: Wallet 선택·동의 시 일시 서버 처리를 명시. 실제 배포 업체·처리 위치는 호스팅 결정 후 확인하고 운영 설정과 안내에 반영해야 합니다.
- `index.html`, `tools/rule_pages.py`, 생성 My Card HTML: wallet-config와 새 스크립트 버전 연결. `tools/prepare_site.py`, `sw.js`: 공개 설정만 포함, 서버 디렉터리는 공개 `_site`에 포함하지 않음. 캐시 v29, features JS v9, medical-card v2. `.gitignore`는 비밀 환경파일·certificates·node_modules·PKPass 결과를 제외합니다.
- 검증: 서버 Node 테스트 3개(시험용 인증서로 네 언어 패스·사진·manifest hash·CMS 서명 실제 암호 검증·인증서 불일치·필수값·origin·no-store·요청 크기·요청 제한), Wallet 브라우저 테스트(응답 모의)와 기존 카드 브라우저 테스트, Python 6개·페이지 생성·공개 묶음 준비·diff 검사 통과. 합성 인증서는 메모리에서만 생성하며 Apple가 발급한 인증서가 아니어서 실제 Wallet에는 사용할 수 없습니다.
- 상태: 로컬 개발 완료, Git 커밋·푸시·운영 배포 없음. Apple 인증서 미연결, 서버 미배포, 아이폰 Safari 실제 설치 미검증. 현재 사이트에 활성화된 Wallet 기능으로 안내하지 않습니다.
- 승인 후 절차: `wallet-service/README.md`와 `.env.example`에 기재. Apple Pass Type ID·인증서·비밀키·WWDR·Team ID 연결 → HTTPS 서버 배포와 origin/로그/edge 요청 제한 설정 → wallet-config endpoint 지정 → 실제 아이폰 파일 열기·Wallet 추가 검증 → 홈페이지 배포. 인증서·비밀키는 채팅에 보내지 않습니다.

## 공유 안내 수정 — 2026-10-12 / Codex

- 사용자가 Windows 공유 메뉴에서 카카오톡을 선택했으나 파일이 채팅에 붙지 않는다고 보고했습니다. 현재 공유는 URL이 아닌 PNG File 전달 방식이므로 외부 배포 전이라는 이유로 단정할 수 없습니다. 실제 카카오톡 연결 실패 원인은 미확인입니다.
- medical-card.js: 공유 완료를 단정하는 문구를 공유 메뉴 열림·앱 첨부 확인 안내로 변경하고, PC 카카오톡에는 PNG 다운로드 후 직접 파일 첨부 대체 경로를 안내합니다. Windows의 navigator.share 완료는 공유 팝업 실행 시점일 수 있어 앱 전송 성공으로 해석하지 않습니다.
- 검증: JS 구문·기존 브라우저 회귀 검증 통과. 카카오톡으로 실제 메시지를 보내는 테스트는 수행하지 않았습니다. 로컬 변경이며 운영 배포는 수행하지 않았습니다.

## 최신 작업: 진료용 카드 작성·휴대폰 저장 — 2026-10-12 / Codex

- 사용자 요청: 예시 → 간단 작성 → 언어별 미리보기 → 휴대폰 저장을 순차 개발. 현재 작업 범위를 이 카드 제작 흐름까지 확장했습니다. 아래 이전 기록의 범위·배포 상태는 당시 기준입니다.
- 시작 시 `main` 작업 폴더는 깨끗했고 `git fetch origin` 후 `HEAD...origin/main`은 0/0이었습니다. 사용자 최신 변경을 보존했습니다.
- `medical-card.js`: 가상 예시 카드, 간단 입력(이름·체중·보호자 전화 필수), 건강 선택·원문 메모·선택 사진, 네 언어 미리보기, PNG 생성·다운로드, 파일 공유 지원 판별과 대체 이미지 미리보기, 카드 전용 인쇄·PDF 저장. 내보내기 이미지에서 긴 메모를 줄바꿈하고 높이를 늘려 잘림을 방지합니다. 공유 파일은 버튼을 누르기 전에 준비합니다.
- `features.js`, `features.css`, `mycard.js`: My Card 상단에 제작 흐름 연결. 기존 `pt-wallet`·IndexedDB 사진 재사용, 간단 작성 시 접종·항체검사·칩·기존 추가 필드와 국가별 `pp3c-*` 기록 보존. 예시를 개인 데이터에 저장하지 않습니다. `없음`과 `미입력`을 구분하고 직접 쓴 내용은 원문으로 표시합니다. 사진 미리보기 URL은 기존 상세 카드와 독립시켰습니다. 검색의 `#medical`은 제작 영역으로 이동합니다.
- GA 이벤트: `medical_example_view`, `medical_create_start`, `medical_create_complete`, `medical_language_select`, `medical_image_download`, `medical_image_share`, `medical_print_request`. 전달 값은 언어뿐이며 개인 정보는 없습니다. 다운로드·인쇄 이벤트는 요청 동작이며 실제 사진첩 저장·PDF 저장 성공을 의미하지 않습니다.
- `tools/rule_pages.py`, `tools/build_pages.py`, 생성 HTML·검색 색인: 진료용 카드 안내 갱신과 스크립트 연결. `tools/prepare_site.py`, `sw.js`: 새 스크립트 배포·오프라인 캐시에 포함. 캐시 v28, features JS v8·CSS v6, medical-card v1, mycard v2.
- `tools/test_medical_card.cjs`: 개인 브라우저와 분리한 Chrome 자동 검증. 예시 비저장, 필수 입력, 기존 정보·체크 기록 보존, 건강 선택 상호 배제, 사진, 네 언어 PNG 다운로드, 공유 모의 실행·미지원 대체, GA 개인정보 제외, 모바일 390px 가로 넘침 없음, 실제 인쇄 문서 내용(인쇄 호출 모의), 저장 실패 처리, 긴 메모, 기존 SOS 호환, 서비스 워커 오프라인 이미지 생성 성공. 네 언어 PNG와 모바일 화면을 직접 열어 시각 검수했습니다.
- 검증: 페이지 생성·Python 검증 6개·공개 파일 준비·JS 구문 검증·브라우저 검증·git diff --check 통과. 공개 페이지 27개, 검색 항목 168개. Hero·규정 data.json은 변경하지 않았습니다.
- 상태: 로컬 저장과 `_site` 준비 완료. 커밋·푸시·운영 배포는 수행하지 않았습니다. 로컬 미리보기 `http://127.0.0.1:8766/mycard/`.
- 미검증: 실제 아이폰 Safari·안드로이드의 공유 메뉴/사진첩 저장, OS 인쇄 대화상자에서 PDF 저장 완료, 운영 GA 수신. 자동 검증의 공유·인쇄는 모의 호출입니다. 운영 배포 전 실제 휴대폰에서 저장·공유·인쇄를 확인하면 됩니다.
- 테스트 실행: 로컬 서버를 8766 포트로 실행한 뒤 Playwright가 설치된 Node 환경에서 `node tools/test_medical_card.cjs`. URL은 `PAWTRIP_TEST_URL`, 브라우저 실행 파일은 `PAWTRIP_TEST_BROWSER`, 결과 폴더는 `PAWTRIP_TEST_ARTIFACTS`로 지정할 수 있습니다. 테스트 결과물은 저장소 밖 `C:\Dev\PetPassport\mycard-verification`에 보관했습니다.

## 현재 범위 — 2026-10-12 / Codex

사용자 요청에 따라 검색 페이지 확장, 국가별 준비사항 체크박스, My Card의 체크 기록 관리만 남겼습니다. Hero는 Git HEAD의 기존 HTML·디자인·영상으로 복원했습니다. 이전 Hero 시안의 배치·색감·캐릭터·모션 제작 조건은 폐기했으며 다음 작업에 적용하지 않습니다.

- 소스: `C:\Dev\PetPassport\PetPassport`
- GitHub: `https://github.com/Gonggit-0710/PetPassport`
- 브랜치: `main`
- 이 채팅 기본 폴더 `C:\Dev\PawTrip4u_Blog`는 홈페이지 저장소와 다릅니다. 해당 폴더의 AGENTS.md에 위 저장소를 안내했습니다.
- 이전 검색·체크박스·My Card 기능은 사용자가 커밋·푸시·운영 배포했습니다. 운영 사이트의 사이트맵 28개 주소와 체크 저장·My Card 연동·원본 Hero 영상 재생을 확인했습니다. 아래 새 주소 변경은 로컬 상태이며 아직 커밋·푸시·배포하지 않았습니다.

## 최신 작업: 메뉴와 실제 주소 일치 — 2026-10-12 / Codex

- 사용자 요청: My Card를 `/mycard/`, 국가 메뉴를 `/countries/`로 연결하고 검색되도록 변경.
- `tools/rule_pages.py`, `mycard/index.html`, `mycard.js`: My Card 독립 페이지 생성. 정적 소개 본문·title·description·canonical을 제공하고 기존 features.js의 wallet 기능을 재사용합니다. 기존 localStorage·IndexedDB의 체크 기록·반려견 정보·서류를 그대로 읽습니다. My Card에 사용자 개인 기록을 정적 파일로 출력하지 않습니다.
- 국가 목록의 기존 카드·거리 필터·난이도/준비일 정렬을 유지했습니다. 국가별 체크리스트 버튼은 `/countries/{id}/#requirements`에 연결합니다.
- `index.html`, `nav.js`, `features.js`, `search.js`, `manifest.webmanifest`, 생성기: My Card·국가 메뉴·검색·홈페이지 버튼을 실제 주소로 연결. 이전 `/#wallet`, `/#countries`, `/#jp` 등 국가 코드 주소는 실제 페이지로 이동합니다. 다국어 카드에서 정보 편집은 `/mycard/?edit=1`로 연결합니다.
- `search-index.json`, `sitemap.xml`: My Card 소개·준비 체크리스트·서류·백업 검색 항목과 실제 주소 추가. 전체 27개 생성 페이지·검색 항목 167개. 사이트 검색에서 정확히 My Card를 입력하면 관리 페이지가 우선 표시됩니다.
- `tools/prepare_site.py`, `sw.js`: My Card HTML·스크립트를 공개 배포 묶음과 오프라인 저장 목록에 포함. 캐시 v27, nav v6·search v5·features v7.
- `tools/test_rule_pages.py`: My Card의 정적 검색 본문·검색 색인·배포 파일 포함 회귀 검증 추가. 생성·자동 검증 6개·공개 파일 준비 성공, git diff --check 통과.
- 브라우저: `/mycard/` 새로고침 유지, 체크→국가 상세 공유→기존 상태 복원, 국가 메뉴 `/countries/` 이동, 단거리 필터 일본·중국 표시, 기존 해시 주소 전환, My Card 검색 결과 1순위, 반려견 정보 편집 확인. 테스트 입력 정보는 저장하지 않았습니다.
- Hero 코드·미디어와 data.json은 변경하지 않았습니다. 이번 새 주소 변경은 로컬 저장 상태이며 사용자 GitHub Desktop 커밋·푸시 후 배포가 필요합니다. 검색 엔진 실제 색인은 아직 확인하지 않았습니다.

## 유지한 변경과 이유

- `tools/rule_pages.py`, `tools/build_pages.py`: data.json에서 국가 12개·항공사 6개 상세, 목록과 My Card 소개를 생성. 기존 안내 페이지를 합쳐 26개 HTML 페이지, 검색 항목 163개입니다. 실제 URL·본문·canonical·검색 색인·사이트맵으로 검색 접근을 확장했습니다.
- `countries/`, `airlines/`, `sos/`, 기존 안내 페이지, `rules.css`, `search-index.json`, `sitemap.xml`: 생성 결과입니다. 국가 카드는 기존 접기 레이아웃과 최소 준비일·난이도·거리, 요건·타임라인·검역·공식 출처를 유지합니다.
- `index.html`, `tools/rule_pages.py`, `base.css`, `rules.css`: 입국 요건을 사용자가 직접 체크할 수 있게 구현. 국가별 `pp3c-{id}` 저장 키를 목록·상세·기존 해시 체크리스트에서 공유합니다.
- `features.js`, `features.css`: My Card에서 국가별 완료 개수·진행률과 체크리스트를 관리합니다. 기존 반려견 정보·서류·백업 기능을 보존하고 백업 JSON에 국가별 체크 상태를 포함합니다. 체크 상태가 없는 이전 백업은 기존 기록을 덮어쓰지 않습니다.
- `index.html`, `nav.js`, `search.js`, `manifest.webmanifest`, 생성기: My Card 명칭과 링크 연결. 진입 버튼은 준비하기 위, 모바일 상단에 표시합니다. `/#wallet`은 관리 화면, `/#sos`는 기존 다국어 진료용 기능입니다. 기존 해시 메뉴·계산기를 유지하고 검색 결과에서 상세 실제 URL로 이동합니다.
- `tools/prepare_site.py`, `.github/workflows/pages.yml`, `.gitignore`, `README.md`: 공개 파일만 _site로 준비하고 main의 생성→검증→Pages 배포, PR의 생성→검증을 구성했습니다.
- `AGENTS.md`, `CLAUDE.md`: Claude와 Codex 공통 작업·인수인계 지침입니다. Higgsfield 생성은 명시적 승인 후에만 진행한다는 사용자 선호는 계속 적용합니다.
- `sw.js`: 캐시 v26, base.css v13으로 갱신해 이전 Hero 스타일의 캐시를 교체합니다.

체크 기록은 현재 브라우저의 localStorage에 자동 저장됩니다. 서버 계정·기기 간 동기화 기능은 없습니다. `data.json`은 변경하지 않았으며 규정 자체를 새로 확인한 작업도 아닙니다.

## 삭제·복원한 Hero 작업

- index.html의 Hero 블록을 Git HEAD 원본과 동일하게 복원했습니다. 추가 커버 상태 코드·풍경 동기화·장식·배치를 제거했고 base.css의 추가 Hero 스타일도 제거했습니다.
- 기존 `media/hero-loop.mp4`, `media/hero-loop.webm`, `media/hero-poster.jpg`, `media/hero.mp4`는 보존했습니다.
- 저장소에 추가했던 Hero 시안 이미지·영상·풍경·포스터 18개와 `tools/correct_hero_video.py`, `tools/finalize_hero_video.py`, `docs/HERO_VIDEO_BRIEF.md`, `docs/HERO_VIDEO_PROMPT.md`를 삭제했습니다. _site도 다시 준비해 배포 묶음에 시안이 남지 않도록 했습니다.
- 이전 Hero 제작 이력·조건을 이 인수인계 문서에서 제거했습니다. 저장소 밖의 임시 검수 자료와 서비스 제작 이력은 프로젝트 배포 대상이 아닙니다.

## 검증 결과

- `python tools/build_pages.py`: 26개 페이지·검색 항목 163개 생성 성공.
- `python -m unittest discover -s tools -p 'test_*.py'`: 5개 테스트 통과.
- `python tools/prepare_site.py`: 공개 배포 묶음 재생성 성공.
- 브라우저: 일본 상세의 체크 해제→새로고침 유지→My Card 5/6 반영→My Card에서 다시 체크→상세 페이지 6/6 복원 확인. 기존 사용자 체크 상태로 되돌렸습니다.
- 브라우저: 기존 Hero 레이아웃·원본 영상 표시 확인.
- 미검증: 실제 운영 배포·검색 엔진 색인, 백업 파일의 실제 가져오기.

## 남은 일

1. 로컬 변경을 검토한 뒤 GitHub에 공유·배포합니다. 앱 프로젝트의 주 폴더 변경은 수행하지 않았습니다.
2. Actions 배포를 사용할 경우 Settings → Pages → Source를 GitHub Actions로 설정해야 합니다. 로컬 workflow만으로 설정이 바뀌지는 않습니다.
3. 월초 공식 규정 확인은 기존 Claude 예약 작업에서 담당합니다. 예약이 data.json을 직접 갱신·푸시하는지, 대화로 보고만 하는지는 확인이 필요합니다. 예약은 중복 생성하지 않습니다.
4. 규정 갱신 후 위 생성·검증·준비 명령을 실행합니다. Actions 설정 후 data.json을 푸시하면 재생성됩니다. branch 배포를 유지한다면 생성 HTML·검색 색인·사이트맵도 함께 공유해야 합니다.
5. 실제 배포 후 신규 URL과 Search Console 사이트맵·색인 상태를 확인합니다.

## 다음 기록 형식

- 날짜 / 담당 AI:
- 변경한 파일 / 이유:
- 검증 결과 / 미검증 항목:
- 로컬 저장 / 커밋 / 푸시 / 운영 배포 상태:
- 남은 일:
