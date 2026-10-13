# 공이 히어로 발도장 방향 수정

2026-10-12 사용자 요청: 여권에 찍힌 발도장이 공이의 발 방향과 반대로 보여 방향을 바로잡기.

- 제공 원본: `C:\Users\YZCHENG\Downloads\hf_20260930_012733_be8bacee-3a9f-4d09-b86e-b9abb6928eea.mp4` (1440×1440, 24fps, 12.25초).
- AI 재생성·Higgsfield 크레딧 사용 없이 로컬 영상 편집. 원본 8.45~9.67초의 여권 잉크 영역을 분리해 180도 회전하고, 밝은 종이와 잉크 영역에만 합성해 공이의 발/얼굴이 앞에서 가리도록 처리했습니다. 나머지 장면·모션·여권 표지는 수정하지 않았습니다. 인코딩에 따른 압축 차이는 있습니다.
- 재현 도구: `tools/correct_hero_stamp.py`. 제공한 특정 원본의 해상도·프레임률·위치에 맞춘 보정이며 임의의 다른 영상에 범용 적용하지 않습니다. NumPy/Pillow와 FFmpeg/FFprobe가 필요합니다. 홈페이지 빌드에서 자동 실행하지 않습니다.
- 수정 원본 출력: `C:\Dev\PetPassport\hero-stamp-review\gong-passport-stamp-fixed.mp4` (1440px, 원래 길이·오디오 유지).
- 기존 홈페이지 영상 백업: 같은 검수 폴더의 `before-hero-loop.mp4`, `before-hero-loop.webm`. 제공 원본과 기존 `media/hero.mp4`, 포스터는 보존했습니다.
- 홈페이지 출력: `media/hero-loop.mp4`, `media/hero-loop.webm` (960px, 무음, 11.75초). 기존 루프와 동일하게 원본 앞 0.5초 제외. `index.html`의 두 영상 URL v2와 sw.js v36으로 캐시 갱신. 기존 히어로 레이아웃 유지.
- 검증: 보정 프레임 30개·동작 구간 연속 프레임 시트 검수, MP4/WebM 브라우저 디코딩·재생/해상도/길이 확인, 홈페이지를 실제 재생해 8.72초 발도장 장면 캡처·방향 확인. 공개 묶음 검사·diff 통과.
- 상태: 로컬 홈페이지 적용·공개 배포 묶음 준비 완료. 커밋·푸시·운영 배포 미실행.

재현 예시(번들 Python 경로를 사용):

```powershell
& 'C:\Users\YZCHENG\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools/correct_hero_stamp.py 'C:\Users\YZCHENG\Downloads\hf_20260930_012733_be8bacee-3a9f-4d09-b86e-b9abb6928eea.mp4' 'C:\Dev\PetPassport\hero-stamp-review\gong-passport-stamp-fixed.mp4'
```
