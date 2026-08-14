# users 컬렉션 일괄 업로드

`users.xlsx` 또는 `users.csv` 파일 하나로 Firestore `users/{employeeId}` 문서를 한꺼번에 upsert하는 로컬 관리자 CLI입니다. 브라우저 앱(로그인 화면)과는 완전히 분리되어 있고, 트레이니가 쓰는 화면에는 이 기능이 전혀 노출되지 않습니다.

## 준비

1. 이 저장소 루트에서 의존성 설치:
   ```
   npm install
   ```
2. Firebase 서비스 계정 키 발급: Firebase 콘솔 → 프로젝트 설정(⚙️) → 서비스 계정 탭 → "새 비공개 키 생성" → JSON 다운로드.
   - **이 파일은 절대 커밋하지 마세요.** 이 프로젝트 밖(예: 홈 디렉터리)에 두거나, 저장소 안에 두더라도 파일명에 `serviceAccountKey` 또는 `service-account`가 들어가면 `.gitignore`가 자동으로 제외합니다.

## 사용법

```
node scripts/upload-users.js <users.xlsx 또는 users.csv> [서비스계정키.json 경로]
```

키 경로를 생략하면 `GOOGLE_APPLICATION_CREDENTIALS` 환경변수를 대신 사용합니다.

예:
```
node scripts/upload-users.js ~/Downloads/users.xlsx ~/keys/casino-dealer-training-key.json
```

## 엑셀/CSV 컬럼

헤더 행에 아래 4개 컬럼이 (순서 무관) 있어야 합니다 — `scripts/users.sample.csv` 참고:

| 컬럼 | 설명 |
|---|---|
| `employeeId` | 사번. Firestore 문서 ID로 그대로 사용됩니다 (`users/501482`). 앞자리 0을 유지하려면 엑셀에서 이 컬럼을 텍스트 서식으로 지정하세요 — 숫자 서식이면 엑셀이 이미 0을 지운 상태로 넘어옵니다. |
| `name` | 이름 |
| `department` | 부서 |
| `active` | 로그인 허용 여부. `TRUE`/`FALSE`, `1`/`0`, `Y`/`N` 모두 인식합니다. |

## 동작 방식

- 같은 `employeeId`가 이미 Firestore에 있으면 **필드 병합(upsert)** — 문서 전체를 지우고 새로 쓰는 게 아니라 `name`/`department`/`active`만 덮어씁니다.
- 파일 안에서 같은 `employeeId`가 여러 행에 나오면 마지막 행 값으로 처리하고 콘솔에 경고를 남깁니다.
- `employeeId` 또는 `name`이 빈 행이 하나라도 있으면 **아무것도 업로드하지 않고** 어느 행에 문제가 있는지 전부 출력합니다 — 부분 업로드로 데이터가 뒤섞이는 것을 막기 위해서입니다.
- 500건 단위로 배치 처리합니다 (Firestore 배치 쓰기 한도).
