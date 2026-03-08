# Google OAuth 테스트 사용자 설정 가이드

## 문제 현상

Google 인증 시 아래와 같은 403 에러가 발생하는 경우:

```
액세스를 블록: MarkDown은 Google의 審사 프로세스를 완료하지 않았습니다.
이 앱은 현재 테스트 중이며, 개발자에게 승인된 테스터만 액세스할 수 있습니다.
에러 403: access_denied
```

## 원인

Google Cloud Console에서 OAuth 동의 화면(Consent Screen)이 **"Testing"** 상태일 때, 등록된 테스트 사용자만 OAuth 인증이 가능합니다. 테스트 사용자로 등록되지 않은 계정으로 로그인하면 403 에러가 발생합니다.

## 해결 방법

### 1. 테스트 사용자 추가 (권장)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 좌측 메뉴에서 **APIs & Services** → **OAuth consent screen** 이동
3. **Test users** 섹션에서 **Add users** 클릭
4. 사용할 Google 계정 이메일 주소 입력 (예: `example@gmail.com`)
5. **Save** 클릭

> 테스트 사용자는 최대 100명까지 추가 가능합니다.

### 2. 앱을 Production으로 전환 (선택)

모든 Google 계정에서 접근을 허용하려면:

1. **OAuth consent screen** 페이지에서 **Publish App** 클릭
2. 확인 다이얼로그에서 **Confirm** 클릭

> 주의: `drive.readonly`, `drive.file` 등 민감한 스코프를 사용하는 경우 Google의 검증 절차가 필요할 수 있습니다.

## credentials.json 위치

OAuth 인증에 필요한 `credentials.json` 파일은 플랫폼별 아래 경로에 위치해야 합니다:

| 플랫폼 | 경로 |
|--------|------|
| macOS | `~/Library/Application Support/doc-to-markdown-editor/google-auth/credentials.json` |
| Windows | `%APPDATA%\doc-to-markdown-editor\google-auth\credentials.json` |
| Linux | `~/.config/doc-to-markdown-editor/google-auth/credentials.json` |

## credentials.json 생성 방법

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services** → **Credentials** 이동
3. **Create Credentials** → **OAuth client ID** 선택
4. Application type: **Desktop app** 선택
5. 생성 후 JSON 파일 다운로드
6. 다운로드한 파일을 `credentials.json`으로 이름 변경 후 위 경로에 배치

## 필요한 API 활성화

**APIs & Services** → **Library**에서 아래 API를 활성화해야 합니다:

- Google Drive API
- Google Docs API
- Google Sheets API

## 참고사항

- OAuth 콜백을 위해 **포트 3333**이 방화벽에서 허용되어야 합니다
- `credentials.json` 파일은 절대 Git에 커밋하지 마세요
- 인증 토큰은 `token.json`으로 같은 디렉토리에 자동 저장됩니다
