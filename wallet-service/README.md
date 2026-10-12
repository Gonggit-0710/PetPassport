# PawTrip Apple Wallet 발급 서버

현재 구현은 시험용 인증서로 PKPass 구조·서명을 검증한 개발 상태입니다. Apple Developer Program 승인과 실제 Apple 인증서를 받은 뒤 아이폰에서 설치를 확인해야 합니다. `wallet-config.js`의 endpoint는 아직 비어 있으므로 홈페이지 버튼은 준비 중입니다.

## 승인 후 연결 순서

1. Apple Developer 계정에서 Pass Type ID(예: `pass.us.pawtrip.mycard`)를 등록하고 해당 ID의 Pass Type ID 인증서를 발급합니다. Team ID도 확인합니다. CSR을 만들 때 사용한 비밀키를 보관해야 합니다.
2. 인증서·비밀키를 PEM으로 준비하고 Apple의 해당 WWDR 중간 인증서도 PEM으로 준비합니다. 인증서 UID·OU와 Pass Type ID·Team ID가 일치해야 합니다. 서버가 인증서 유효기간·발급자 서명·비밀키 일치를 확인합니다.
3. 서버 호스팅의 비밀 환경변수에 `.env.example` 항목을 설정합니다. PEM 파일 내용을 Base64 인코딩하여 각 환경변수에 넣습니다. 인증서·비밀키·환경변수는 채팅·Git 저장소·홈페이지 코드에 넣지 않습니다.
4. 이 폴더를 독립 Node 프로젝트로 배포합니다. 기본 HTTP 서버는 `node server.js`; Node serverless 호스팅은 `api/wallet-pass.js`를 이용할 수 있습니다. Vercel의 경우 이 폴더를 프로젝트 루트로 지정합니다. HTTPS 연결과 `/api/wallet-pass` 주소가 필요합니다. 호스팅의 요청 본문 로깅·디버그 캡처를 끄고 edge 단위 요청 제한을 설정하세요. 포함된 IP 제한은 프로세스 하나의 보조 제한입니다.
5. `ALLOWED_ORIGINS`에 홈페이지 origin을 정확히 등록하고, 저장소 루트 `wallet-config.js`의 endpoint에 배포한 HTTPS URL을 넣습니다. 개발 origin은 테스트 때만 명시적으로 추가합니다. `.env`의 `HOST`는 배포 환경에 맞게 지정합니다(독립 서버 외부 수신은 `0.0.0.0`).
6. 개인정보 안내의 실제 처리 업체·국가·운영 설정을 배포 환경에 맞춰 검토합니다. 홈페이지에서 카드 미리보기 → Apple Wallet → 정보 전송 동의 → 발급 → 파일 열기를 실제 아이폰 Safari에서 검증합니다. PKPass 다운로드에서 Wallet 추가 화면까지의 동작은 아직 실기기 미검증입니다.

서버는 카드마다 무작위 serialNumber를 발급합니다. 개인 정보는 요청 처리 메모리에서만 사용하며 파일·DB·로그에 저장하지 않습니다. 생성한 파일의 응답은 `Cache-Control: no-store`입니다. 서버 재발급 시 새 카드가 생기므로 Wallet에서 기존 카드를 직접 정리하세요. 자동 갱신·QR 공유·기기 간 서버 동기화는 구현하지 않았습니다.

카드 앞면: 이름·체중·전화·주요 지병·알레르기. 상세 면: 복용약·추가 정보·원문 표시 안내·생성일. 전화·건강 정보가 포함되므로 다른 사람에게 넘기기 전 확인하세요. Wallet 내 공유는 `sharingProhibited`로 비활성화합니다.

## 개발과 검증

```powershell
pnpm install --frozen-lockfile
pnpm test
node --env-file=.env server.js
```

`test/pass.test.js`는 합성 시험용 인증서를 메모리에서만 생성합니다. 이는 Apple가 발급한 인증서가 아니며 실제 Wallet 설치에 사용할 수 없습니다. 테스트는 네 언어 카드·사진 크기·manifest hash·CMS 서명·인증서 불일치·필수값·요청 크기·origin·응답 캐시·요청 제한을 확인합니다.

홈페이지의 기존 PNG 저장과 기본 카드 입력은 인증서·서버 없이 계속 작동합니다. 발급 서버 디렉터리는 `tools/prepare_site.py`의 공개 배포 묶음에 포함되지 않습니다. GitHub Pages에서 저장소 루트를 직접 공개하는 배포를 쓸 경우에도 비밀 파일은 저장소에 추가하지 마세요.

공식 참고: https://developer.apple.com/wallet/get-started/ , https://developer.apple.com/help/account/capabilities/create-wallet-identifiers-and-certificates/
