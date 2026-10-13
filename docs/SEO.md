# Google 검색 최적화와 운영 확인

2026-10-13 기준. 검색 순위나 색인은 코드만으로 보장되지 않습니다. 공개 페이지를 발견하고 내용을 이해하기 쉽게 만드는 개선입니다.

## 이번 확인과 적용

- 사용자 Search Console 화면으로 pawtrip.us 속성 등록 확인. 화면에 색인 페이지 1개/검색 클릭 0회가 표시되어 있으나, 다른 페이지의 미발견 원인이나 전체 최신 상태를 이 화면만으로 확정할 수는 없습니다.
- 사이트맵 제출 목록이 비어 있었고, `https://pawtrip.us/sitemap.xml` 제출 방법을 안내했습니다. 사용자가 **제출 성공**을 확인했습니다. 제출 작업은 사용자가 수행했습니다.
- 운영 robots.txt·sitemap.xml·일본 규정·PawLog 목록의 HTTP 200 확인, X-Robots-Tag 차단 헤더 없음. 공개 사이트맵은 페이지 36개입니다.
- 홈페이지의 검색 제목 보강. 로고의 h1을 일반 컨테이너로 바꾸고 실제 히어로 제목을 h1으로 표시해 제목 구조 정리. 히어로 디자인·영상은 그대로 유지.
- 주요 메뉴와 목적지·항공사별 상세 주소를 정적 HTML 링크로 제공. 자바스크립트 없이도 홈페이지에 실제 안내와 링크가 있으며, 기존 JS 계산기·라우팅은 유지합니다. 접기형 footer 안내로 기존 화면을 긴 본문으로 바꾸지 않았습니다.
- 생성 안내 페이지에 실제 경로 안내와 BreadcrumbList/WebPage JSON-LD, 홈페이지에 WebSite/Organization JSON-LD 추가.
- PawLog는 실제 제목·게시일·대표 이미지·브랜드 작성자를 사용하는 BlogPosting JSON-LD 추가. 원문 링크/홍보 버튼을 되살리지 않았으며 가짜 후기·평점·FAQ 데이터 없음. 작성자의 개인 실명은 임의로 만들지 않았습니다.
- 각 공개 페이지의 고유 제목·설명·canonical을 검사. `/blog/` 호환 페이지와 404는 noindex 유지. 승인된 Games 개인정보처리방침은 원문 유지 조건 때문에 수정하지 않았습니다.
- `seo-dates.json`은 제목·설명·본문·JSON-LD 지문과 수정일을 기록합니다. 변경된 페이지만 sitemap lastmod를 갱신하며 단순 재빌드·캐시 버전 변경은 날짜를 갱신하지 않습니다. 기존 공식 규정 확인일(data.json의 verified)은 바꾸지 않았습니다.
- 404 안내 페이지 추가, 공개 묶음에 포함. 서버의 실제 404 응답은 GitHub Pages가 처리합니다.
- 메뉴 4개 언어 선택은 기존 로컬 UI 번역입니다. 완전한 언어별 본문/주소가 없으므로 hreflang이나 별도 번역 URL을 만들어 검색엔진에 오인시키지 않았습니다.

## 재생성·검증

```powershell
python tools/build_pages.py
python -m unittest discover -s tools -p 'test_*.py'
python tools/prepare_site.py
python tools/check_release.py
```

`tools/test_seo.py`는 정적 링크·고유 제목/설명/canonical·JSON-LD 구문/원본 일치·재빌드 시 수정일 안정성을 검사합니다. 로컬 정적 검사는 Google Rich Results Test/실제 색인 결과를 대신하지 않습니다.

## 배포 이후 확인 순서

1. GitHub Desktop에서 변경 파일 검토·커밋·Push origin. Pages 배포 성공 확인.
2. 운영 홈페이지/국가·항공사 상세/PawLog에서 새 제목·canonical·JSON-LD와 사이트맵을 확인합니다.
3. Search Console > Sitemaps에서 제출한 주소의 처리 상태와 발견된 페이지 수를 확인합니다. 주소는 그대로이므로 매번 새 사이트맵 URL을 만들지 않습니다.
4. URL 검사에 `/`, `/countries/jp/`, `/countries/us/`, `/airlines/ke/`, `/pawlog/`와 대표 글 하나를 입력합니다. 실시간 URL 테스트로 Google이 본문을 읽을 수 있는지 확인한 뒤 필요한 대표 URL에 색인 요청합니다. 같은 주소를 반복 요청하는 것을 운영 전략으로 삼지 않습니다.
5. 운영 URL로 Google Rich Results Test에서 Breadcrumb/BlogPosting을 확인합니다.
6. 페이지 색인 생성 보고서의 발견됨/크롤링됨/대체 페이지 등 실제 사유와 검색 실적의 노출·검색어·클릭을 확인합니다. 클릭이 0회라는 사실만으로 차단·벌점이나 기술 장애를 단정하지 않습니다.

추가 검색 유입은 공식 규정 안내를 최신으로 유지하고, 사용자가 찾는 목적지별 질문에 실제 경험과 근거로 답하는 글을 꾸준히 게시하면서 개선합니다. 네이버 초안을 옮길 때는 `docs/PAWLOG-WRITING-GUIDE.md`를 따릅니다.

## 공식 기준

- [Google SEO 시작 가이드](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [크롤링 가능한 링크](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [사이트 이름](https://developers.google.com/search/docs/appearance/site-names)
- [Breadcrumb 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Article 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/article)
- [사이트맵 생성·제출과 수정일](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
