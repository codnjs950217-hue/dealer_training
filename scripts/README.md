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

## 파일 업로드가 막힌 PC에서 (엑셀 복사-붙여넣기, 키 파일 불필요)

1. Firebase Studio에서 저장소 루트의 `new-users.txt`를 엽니다(git에 올라가지 않음).
2. 엑셀에서 **머리글 행까지 포함해** 표를 복사(Ctrl+C)해 그 파일에 붙여넣고 저장합니다. 머리글은 `사번 / 이름 / 부서 / 활성` 또는 영문 `employeeId / name / department / active` 둘 다 됩니다. `활성` 칸이 없으면 전원 활성, `부서` 칸이 없으면 빈 부서로 등록됩니다.
3. 먼저 미리보기(아무것도 쓰지 않음):
   ```
   node scripts/upload-users.js new-users.txt --dry-run
   ```
4. 표가 맞으면 실제 업로드:
   ```
   node scripts/upload-users.js new-users.txt
   ```
키 파일을 넘기지 않으면 Firebase Studio에 로그인된 gcloud 계정으로 씁니다.

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

---

# 학습리포트 추출 (trainingDaily → Excel/CSV)

관리자 전용 학습 기록을 기간별로 뽑아 `.xlsx`와 `.csv`(엑셀 한글 깨짐 방지 BOM 포함)로 저장합니다. 준비(의존성 설치, 서비스 계정 키)는 위 사용자 업로드와 같습니다.

```
node scripts/export-training.js <시작일> <종료일> [서비스계정키.json 경로]
```

예:
```
node scripts/export-training.js 2026-10-01 2026-10-31 ~/keys/casino-dealer-training-key.json
```

현재 폴더에 `training-report_2026-10-01_2026-10-31.xlsx` / `.csv`가 생깁니다.

## 칸 순서

`date, department, employeeId, name, lastAt`, 이어서 게임별 `Count, Minutes, Mistakes`를 **Baccarat → Blackjack → Roulette → Poker** 순서로, 맨 끝에 하루 합계 `totalCount, totalMinutes, totalMistakes, sessionCount`.

- 한 행 = 한 사람의 하루. 행은 `lastAt`(마지막 학습 시각, KST) 순.
- Firebase Console은 필드를 항상 알파벳순으로 보여주므로, 이 순서는 추출 파일에서만 적용됩니다.
- 부서가 비어 있는 기록은 `users` 컬렉션의 부서로 채웁니다.
