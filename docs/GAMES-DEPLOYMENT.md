# Paw Trip 게임 영역 배포

## 2026-10-13 16:28 개정 적용

- 새 앱 아이콘은 `/games/assets/app-icon-v2.png`(122,416바이트, SHA-256 `34636cba9c6c487cfd99146fe663ee3a2da8b12cae0e332f737c8821a1a3e1e2`). 두 소개 페이지의 본문·favicon·og:image 모두 새 이름 사용.
- 한국어 소개 마지막 줄은 ‘로그인 없이 바로 시작.’, 영어는 ‘No login needed.’. 소개/메타에 광고 문장이나 광고 종류 약속을 넣지 않음. 승인 방침은 변경하지 않음.
- 스크린샷은 소개 페이지 #ko/#en 목록 아래·버튼 위에 각각3장, 지정 순서와 alt 그대로. PC에서는 언어별3장 한 줄, 모바일에서는 가로 스냅 스크롤. 원본1080×1920 PNG 그대로 복사하고 자르거나 늘이지 않음. 목록 페이지에는 스크린샷 없음.
- 원본/배포 파일의 크기·SHA/alt/언어/순서는 `tools/game-assets.json`에 기록. 이 파일은 내부 검증용으로 공개 묶음에 포함하지 않음. `tools/check_release.py`가 승인된 아이콘/6개 스크린샷 해시와 옛 아이콘/광고 문구 잔존을 검사.

2026-10-12 게임 작업 지시서 개정본과 개인정보처리방침 최종본을 기준으로 제작했습니다. 여행 메뉴에 Games 링크 추가는 사용자 결정에 따라 게임 출시 후로 미뤘습니다.

| 운영 주소 | 등록 용도 |
|---|---|
| https://pawtrip.us/games/ | 개발자 웹사이트 |
| https://pawtrip.us/games/not-the-vacuum/ | 게임 소개·지원·마케팅 URL |
| https://pawtrip.us/games/not-the-vacuum/privacy/ | 게임 개인정보처리방침 |
| https://pawtrip.us/app-ads.txt | AdMob 광고 판매자 확인 |

개인정보처리방침은 한국어·영어가 한 페이지에 모두 표시됩니다. 게임 설정에서 사용하는 `privacy/#ko`와 `privacy/#en`을 유지합니다. 최종본의 문장·시행일·최종 수정 날짜를 변경하지 않았고 분석·광고·추적 스크립트도 추가하지 않았습니다. 소개에는 승인된 한국어·영어 문구와 제공된 로고, 보리·토리·구름 그림을 사용했습니다. 스토어 다운로드 링크는 출시 후 연결합니다.

## 배포 준비

```powershell
python tools/build_pages.py
python -m unittest discover -s tools -p 'test_*.py'
python tools/prepare_site.py
python tools/check_release.py
```

`games/`와 `app-ads.txt`는 `_site/` 공개 묶음에 포함합니다. 세 게임 페이지는 사이트맵에 등록하며 robots.txt는 접근을 허용합니다. 게임 영역과 app-ads.txt는 여행 서비스 워커의 처리에서 제외했습니다. 게임 영역은 여행 사이트의 자동 번역 스크립트를 사용하지 않습니다.

AdMob 광고 판매자 파일은 지시서에서 확정한 한 줄입니다.

```text
google.com, pub-6262324542700705, DIRECT, f08c47fec0942fa0
```

실제 배포 전 AdMob 콘솔의 안내 줄과 동일한지 확인합니다. 이 작업에서는 콘솔 계정에 접속하지 않았으며 지시서의 사용자 확정 값을 사용했습니다. 공개 등록 파일은 콘솔 인증 완료를 의미하지 않습니다.

## 운영 확인

Commit/Push 후 Pages 배포가 성공하면 위 네 URL의 HTTP 200을 확인합니다. app-ads.txt는 리디렉션 없이 `text/plain`이어야 합니다. PC와 실제 휴대폰에서 정책 `#ko`·`#en`으로 진입해 해당 제목으로 이동하는지, 두 언어가 계속 보이는지 확인합니다. 기존 서비스 워커가 설치된 브라우저에서는 새 버전 v32 적용을 위해 온라인 새로고침 후 다시 확인합니다.

```powershell
curl.exe -I https://pawtrip.us/app-ads.txt
curl.exe https://pawtrip.us/app-ads.txt
```

배포 확인 후 커밋 ID와 운영 URL 네 개를 게임 기획 담당 채팅에 사용자가 전달합니다. 이 작업에서 다른 채팅으로 메시지는 보내지 않았습니다.
