# rpg-planner

## 기술 스택

- React 19 (`^19.2.5`)
- Tailwind CSS v4 (`@tailwindcss/vite` 플러그인 방식, `^4.3.0`)
- FullCalendar v6 (`@fullcalendar/core`, `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`, `^6.1.20`)
- Chart.js v4 + react-chartjs-2 (`^4.5.1`)
- Dexie v4 + dexie-react-hooks (`^4.4.2`)

## 폴더 구조

```
src/
  components/   # UI 컴포넌트
  constants/    # 정적 상수 (avatars.js, themes.js)
  db/           # Dexie DB 스키마 및 인스턴스
  hooks/        # 커스텀 훅
  utils/        # 순수 함수 (xp.js — XP 계산, 레벨, 업적)
```

## 금지사항

- `tailwind.config.js` 생성 금지 — Tailwind v4는 설정 파일 없이 동작한다
- FullCalendar 유료 플러그인 사용 금지 — `@fullcalendar/resource` 계열 패키지는 설치하지 않는다

## RPG 규칙

### 레벨 시스템 (L1 ~ L10)

| 레벨 | 칭호         | 필요 XP (누적)   |
|------|--------------|-----------------|
| 1    | 견습 모험가  | 0 ~ 199         |
| 2    | 초보 학습자  | 200 ~ 499       |
| 3    | 성실한 학습자| 500 ~ 999       |
| 4    | 숙련된 탐구자| 1,000 ~ 1,499   |
| 5    | 지식의 수호자| 1,500 ~ 2,499   |
| 6    | 현명한 전략가| 2,500 ~ 3,999   |
| 7    | 전설의 학자  | 4,000 ~ 5,999   |
| 8    | 마스터       | 6,000 ~ 8,999   |
| 9    | 그랜드마스터 | 9,000 ~ 11,999  |
| 10   | 시험의 전설  | 12,000 이상     |

### XP 계산 공식

```
일일 XP = min(400, Σ(분 × 직업배율[난이도]) × 연속보너스)
총 XP   = Σ(일별 XP) + 업적 XP
```

- **하루 XP 상한**: 400 XP
- **연속 학습 보너스**: 3일 이상 ×1.1 / 7일 이상 ×1.2
- streak이 끊겨도 과거 날짜의 XP는 변경되지 않음 (날짜별 streak 기준)

### 직업별 난이도 배율

| 직업    | 어려움 | 보통  | 쉬움  |
|---------|--------|-------|-------|
| 전사    | ×1.8   | ×1.0  | ×0.7  |
| 마법사  | ×1.3   | ×1.2  | ×1.0  |
| 궁수    | ×1.5   | ×1.1  | ×0.9  |
| (기본)  | ×1.5   | ×1.0  | ×0.8  |

### 코인 시스템

- 코인 = 완료된 퀘스트 coin 합산 + 출석 보너스(일 1코인)
- 사용 가능 코인 = 총 코인 - spentCoins
- 상점 아이템(아바타, 칠판 문구, 테마 등) 구매에 사용

## DB 규칙

- 현재 버전: **v14**
- Dexie 스키마를 변경할 때마다 반드시 버전 번호를 1 올린다
- 기존 데이터를 변환해야 할 경우 `.upgrade()` 함수를 작성한다

### 테이블 구조 (v14)

| 테이블     | 주요 필드                                                                 |
|------------|--------------------------------------------------------------------------|
| studies    | eventId, date, subject, difficulty, minutes, status (pending/studying/completed) |
| subjects   | name, color                                                              |
| exams      | date, subject, range                                                     |
| characters | nickname, job, avatar, spentCoins, lastVisitDate, bonusCoins, boardMessage, themeBg, themeAccent, unlockedAvatars, unlockedThemes, unlockedAchievements |
| quests     | title, difficulty, coin, status, date                                    |

## 주요 기능

- **칠판 (ClassroomCanvas)**: 상단 고정 칠판 UI, 내장 타이머(시작/일시정지/완료), 칠판 문구 표시
- **상태 패널 (StatusPanel)**: 레벨·XP·진행률·연속 출석·업적 요약, 레벨업/업적 달성 팝업
- **D-day 배너 (DdayBanner)**: 시험 일정 카운트다운, 시험 범위 메모
- **학습 캘린더 (StudyCalendar)**: 공부 기록 추가/편집/삭제, 시험 추가(길게 누르기), 드래그로 날짜 이동
- **퀘스트 패널 (QuestPanel)**: 퀘스트 추가/완료/삭제, 코인 보상
- **캐릭터 스탯 (CharacterStatPanel)**: 체력·지능·집중력·도전력·성실함 5개 스탯 등급(D~S), 등급 상승 팝업
- **통계 (StatsPanel)**: 7일 공부시간 꺾은선, 과목별 파이차트, 주간 리포트
- **상점 (ShopPanel)**: 아바타·칠판 문구·테마 구매 (코인 소비)
- **설정 (SettingsPanel)**: 캐릭터 닉네임·직업, 과목 관리, 시험 관리, 데이터 초기화
- **레벨&업적 모달 (InfoPanel)**: 레벨 칭호 전체 목록, 업적 달성 현황 (StatusPanel에서 팝업으로 열림)

## 코딩 규칙

- 컴포넌트는 함수형만 사용
- TypeScript 사용 안 함 (`.js` / `.jsx` 파일만 사용)
- CSS는 Tailwind 클래스만 사용 (별도 CSS 파일에 스타일 작성 금지)
- 모든 훅(useState, useEffect 등)은 조건부 return 이전에 선언한다
- Dexie 훅(`useStudies` 등)은 초기에 `undefined`를 반환하므로 `?? []` 방어 처리 필요
