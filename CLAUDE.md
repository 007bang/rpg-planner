# rpg-planner

## 기술 스택

- React 18
- Tailwind CSS v4 (`@tailwindcss/vite` 플러그인 방식)
- FullCalendar v6 (`@fullcalendar/core`, `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`)
- Chart.js v4 + react-chartjs-2
- Dexie v4 + dexie-react-hooks

## 폴더 구조

```
src/
  components/   # UI 컴포넌트
  db/           # Dexie DB 스키마 및 인스턴스
  hooks/        # 커스텀 훅
```

## 금지사항

- `tailwind.config.js` 생성 금지 — Tailwind v4는 설정 파일 없이 동작한다
- FullCalendar 유료 플러그인 사용 금지 — `@fullcalendar/resource` 계열 패키지는 설치하지 않는다

## RPG 규칙

- 1시간 공부 = 100 XP
- L1: 0 ~ 499 XP
- L2: 500 ~ 1499 XP
- L3: 1500 XP 이상

## DB 규칙

- Dexie 스키마를 변경할 때마다 반드시 버전 번호를 1 올린다

## 코딩 규칙

- 컴포넌트는 함수형만 사용
- TypeScript 사용 안 함 (`.js` / `.jsx` 파일만 사용)
- CSS는 Tailwind 클래스만 사용 (별도 CSS 파일에 스타일 작성 금지)
