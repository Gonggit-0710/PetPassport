# PawTrip 작업 인수인계

## 현재 범위 — 2026-10-12 / Codex

사용자 요청에 따라 검색 페이지 확장, 국가별 준비사항 체크박스, My Card의 체크 기록 관리만 남겼습니다. Hero는 Git HEAD의 기존 HTML·디자인·영상으로 복원했습니다. 이전 Hero 시안의 배치·색감·캐릭터·모션 제작 조건은 폐기했으며 다음 작업에 적용하지 않습니다.

- 소스: `C:\Dev\PetPassport\PetPassport`
- GitHub: `https://github.com/Gonggit-0710/PetPassport`
- 브랜치: `main`
- 이 채팅 기본 폴더 `C:\Dev\PawTrip4u_Blog`는 홈페이지 저장소와 다릅니다. 해당 폴더의 AGENTS.md에 위 저장소를 안내했습니다.
- 모든 변경은 로컬 저장 상태입니다. 커밋·푸시·운영 배포는 수행하지 않았습니다.

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
