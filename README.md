# 회송리스트 자동화 앱 (XRG1 IPR 스캐너)

쿠팡풀필먼트서비스 XRG1 센터 회송리스트 처리를 IPR바코드 스캔만으로 끝내는 PWA + Google Apps Script 파일럿 앱.

## 폴더 구조

- `frontend/` — 빌드 도구 없는 PWA(Vanilla JS, 브라우저 네이티브 ES 모듈)
- `appsscript/` — Google Apps Script 백엔드 (`doPost` 기반)
- `docs/superpowers/specs/` — 확정 설계 문서
- `docs/superpowers/plans/` — 구현 계획
- `docs/로컬-테스트-가이드.md` — Mock 모드 / 실제 시트 연동 테스트 방법

## 빠르게 확인하기

```bash
cd frontend
npx --yes serve -l 5173 .
```

기본은 Mock 모드라 백엔드 없이 `IPR0001`~`IPR0004`로 전체 흐름을 확인할 수 있습니다. 실제 스프레드시트에 연동하는 방법은 `docs/로컬-테스트-가이드.md`를 참고하세요.

## 테스트

```bash
cd frontend && npm test
cd ../appsscript && npm test
```

## 설계 근거

`docs/superpowers/specs/2026-08-26-회송리스트-자동화-앱-design.md`
