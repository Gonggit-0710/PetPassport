# 2026-10-12 배포 준비

이번 배포에는 My Card의 예시·간단 작성·네 언어 진료용 카드 미리보기·PNG 내려받기·지원 기기의 공유 메뉴·카드 전용 인쇄와 상단 개인정보 안내를 포함합니다. 기존 반려견 정보와 국가별 체크 상태의 저장 키를 유지합니다.

최신 배포 ZIP은 `C:\Dev\PetPassport\releases\pawtrip-mycard-2026-10-12-2.zip`입니다. 견종 드롭다운·직접 입력과 성별·중성화 선택, 영어 Spayed/Neutered 구분을 포함합니다. 접미사 없는 이전 ZIP 대신 이 버전을 사용하세요.

Apple Wallet은 준비 중으로 유지합니다. 공개 `wallet-config.js`의 endpoint는 빈 값이며, 발급 서버는 GitHub Pages 배포 묶음에 포함하지 않습니다. Apple 인증서와 서버 연결·아이폰 설치 검증 후 별도로 활성화합니다.

## 공개 파일 준비와 검증

```powershell
python tools/build_pages.py
python -m unittest discover -s tools -p 'test_*.py'
python tools/prepare_site.py
python tools/check_release.py
```

공개 파일은 `_site/`에 있습니다. 준비된 ZIP은 저장소 밖 `C:\Dev\PetPassport\releases`에 있으며 GitHub Actions 배포에서는 ZIP을 직접 업로드하지 않습니다. ZIP은 검증된 공개 파일의 보관·수동 업로드용입니다. `_site`·테스트 결과·node_modules·비밀 환경파일은 커밋하지 않습니다.

## GitHub Desktop에서 실제 배포

1. 저장소 `C:\Dev\PetPassport\PetPassport`의 변경을 확인합니다. 커밋 제목 예시: `Add My Card creation, PNG export and privacy notice`.
2. Commit 후 Push origin을 실행합니다. main 푸시는 배포 트리거가 될 수 있으므로 운영 반영을 결정했을 때 실행합니다.
3. 기존 Pages가 GitHub Actions 방식이라면 `Build and deploy PawTrip`의 build·deploy 성공을 확인합니다. Source가 브랜치 배포라면 이번에 갱신한 생성 HTML·검색 색인을 함께 커밋해야 합니다. Pages 설정은 이번 준비 작업에서 변경하지 않았습니다.
4. 브라우저에서 `https://pawtrip.us/mycard/`를 새로고침해 상단 개인정보 안내, 예시·입력·PNG 저장, Wallet 준비 중 표시를 확인합니다. 국가별 체크 기록과 기존 SOS·일정 계산도 확인합니다.
5. 아이폰 Safari·안드로이드 Chrome에서 PNG 저장을 확인합니다. 공유 메뉴의 카카오톡 파일 전달은 환경에 따라 다를 수 있으므로 이미지 내려받기·직접 첨부 대체 경로를 안내합니다. 인쇄 API 완료는 실제 PDF 저장 완료를 의미하지 않습니다.

확인한 것: Python 검증 6개, Chrome 격리 브라우저의 카드/Wallet 흐름·모바일·오프라인 검증, 시험용 인증서를 이용한 Wallet 서버 검증 3개, 공개 파일 경로와 배포 제외 파일 검사. 공유·인쇄는 모의 호출이며 실기기 메뉴의 최종 동작은 별도 확인 대상입니다.

## 배포 확인과 되돌리기

새 CSS/JS 버전과 서비스 워커 캐시 v29를 포함합니다. 규정 확인일은 배포 때문에 변경하지 않습니다. 이번 작업에서 Hero와 규정 데이터를 변경하지 않았습니다.

운영 문제가 발견되면 GitHub에서 마지막 배포 커밋을 revert한 커밋으로 되돌린 뒤 동일 배포 절차를 실행합니다. 입력 정보는 같은 운영 도메인의 기기 브라우저에 남습니다. 로컬 미리보기의 기록은 운영 도메인과 별도입니다.
