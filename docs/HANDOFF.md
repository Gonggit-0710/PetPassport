# PawTrip 작업 인수인계

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
