# PawTrip (포트립)

한국에서 반려견과 해외여행을 떠나는 보호자를 위한 검역·탑승 준비 사이트입니다.

- 항공편 선택: 목적지·무게·견종으로 탈 수 있는 항공사와 요금, 신청 방법, 연락처
- 일정 계산: 희망 출국일에서 거꾸로 계산한 검역 준비 일정
- 국가별 입국 규정 12개국, 항공사 비교, 한국 귀국 검역

## 구조

- `index.html` — 화면 (별도 빌드 없음)
- `data.json` — 국가·항공사 규정 데이터. 규정이 바뀌면 이 파일만 고칩니다.
- 각 항목에 공식 출처 URL과 확인일(`meta.verified`)이 들어 있습니다.

## 검색용 페이지와 배포

- `/countries/`, `/countries/{id}/`: 국가 목록과 입국 요건·체크리스트·타임라인
- `/airlines/`, `/airlines/{id}/`: 항공사 목록과 기내·위탁·요금·예약 안내
- `/mycard/`: 국가별 준비 체크 상태, 반려견 정보·서류·백업 관리. 검색용 소개는 정적 HTML에 있으며 개인 기록은 브라우저에서만 불러옵니다.
- `/sos/`: 다국어 진료용 카드 소개. 실제 진료용 화면은 기존 `/#sos`에서 사용합니다.
- 이전 `/#wallet`, `/#countries`, 국가 코드 해시는 해당 실제 주소로 이동합니다. 기존 저장 기록은 보존됩니다. 검색용 페이지 본문은 JavaScript 실행 전에 HTML에 들어 있습니다.

국가·항공사 페이지는 `tools/rule_pages.py`가 **기존 data.json**에서 생성합니다. 규정 내용을 새 HTML에 직접 수정하지 마세요.

```sh
python tools/build_pages.py
python -m unittest discover -s tools -p 'test_*.py'
python tools/prepare_site.py
```

마지막 명령은 공개 파일만 `_site/`에 모읍니다. 테스트에는 JavaScript 문법 검사를 위한 Node.js가 필요합니다.

### GitHub Actions 배포로 전환할 때

저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정합니다. `.github/workflows/pages.yml`은 main 업데이트마다 페이지 생성 → 검증 → 공개 파일 준비 → 배포를 실행합니다. PR에서는 빌드·검증만 실행합니다. 이 설정은 로컬 파일 변경만으로 적용되지 않습니다.

### Claude 월초 크롤링과 연결

Claude의 예약 일정은 그대로 유지합니다. 예약 작업이 공식 규정을 확인하고 `data.json`을 main에 커밋·푸시하면, 위 Actions 배포에서는 국가·항공사 HTML과 사이트맵·검색 색인이 자동으로 재생성됩니다. 크롤링 결과가 대화에만 보고되는 예약이라면, 파일 갱신·푸시 과정은 별도로 연결해야 합니다.

기존 **Deploy from a branch** 방식을 유지한다면, Claude 작업에서 `data.json` 수정 후 `python tools/build_pages.py`를 실행하고 생성된 페이지·사이트맵·검색 색인도 함께 커밋해야 합니다.

`meta.verified`는 실제 규정 확인일입니다. 빌드나 배포만으로 갱신하지 않습니다. 항목별 `verified`가 있으면 그 날짜를 우선하며, 없으면 `meta.verified`를 사용합니다. 국가·항공사 ID는 기존 앱 상태와 주소에 쓰이므로 이름이 바뀌어도 기존 ID를 유지하세요.

## 면책

공식 출처를 요약한 참고 자료입니다. 각국 검역당국과 항공사는 규정을 예고 없이 바꿉니다. 출국 전 공식 출처에서 최신 내용을 다시 확인하세요.
