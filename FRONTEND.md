# ExamEdge — Frontend Documentation

> React 18 + Vite SPA for the ExamEdge AI study platform. Dark-mode-only UI for APPSC/TGPSC
> aspirants. Talks to the ExamEdge Express backend (see `../backend/BACKEND.md`) over Axios with
> JWT auth and silent token refresh; consumes SSE streams for note generation.

---

## Table of Contents

1. [Quick Facts](#quick-facts)
2. [Directory Layout](#directory-layout)
3. [Run & Config](#run--config)
4. [Routing & Auth](#routing--auth)
5. [API Layer (`src/api/`)](#api-layer-srcapi)
6. [State (`src/store/`)](#state-srcstore)
7. [Components (`src/components/`)](#components-srccomponents)
8. [Pages (`src/pages/`)](#pages-srcpages)
9. [Styling System](#styling-system)
10. [Streaming & Test Engine Internals](#streaming--test-engine-internals)
11. [Known Issues, Dead Code & Gotchas](#known-issues-dead-code--gotchas)

---

## Quick Facts

| | |
|---|---|
| **Entry** | `src/main.jsx` → `src/App.jsx` |
| **Stack** | React 18.3, Vite 5.4, Tailwind 3.4, react-router-dom 6.26 |
| **State** | Zustand 4.5 (3 stores, **no persist middleware** — auth uses manual `localStorage`) |
| **HTTP** | Axios 1.7 (`src/api/axiosInstance.js`) with 401 → silent refresh |
| **Markdown** | `react-markdown` 9 + `remark-gfm` 4 |
| **Icons** | `lucide-react` 0.427 |
| **SSE** | Hand-rolled `fetch` + `ReadableStream` reader (the `eventsource-parser` dep is **unused**) |
| **Theme** | Dark only. Tokens: bg `#0B0F1A`, accent `#4F8EF7`, purple `#7B5EF8`, gold `#F5A623`, green `#3DD68C`, red `#F76F6F` |
| **Fonts** | Sora (headings), DM Sans (body) — Google Fonts |
| **Dev port** | `5173` (proxy `/api` → `http://localhost:5001`) |
| **Build** | `vite build` → `dist/` (sourcemaps on) |

---

## Directory Layout

```
frontend/
├── index.html                 ← SEO meta, Google Fonts, mounts /src/main.jsx
├── vite.config.js             ← React plugin + /api proxy → :5001
├── tailwind.config.js         ← Token palette, fonts, animations
├── postcss.config.js          ← tailwind + autoprefixer
├── vercel.json                ← SPA catch-all rewrite
├── nginx.conf                 ← Prod: static + /api proxy → backend:5001
├── Dockerfile                 ← 2-stage: node build → nginx serve
├── .env / .env.example        ← VITE_API_URL
└── src/
    ├── main.jsx               ← createRoot + <App/>
    ├── App.jsx                ← Route table
    ├── index.css              ← Tailwind + hand-rolled design system (~430 lines)
    ├── api/                   ← 8 axios/fetch modules
    │   ├── axiosInstance.js   ← central client + 401 refresh queue
    │   ├── auth.js  prelims.js  notes.js  evaluator.js
    │   ├── history.js  syllabus.js  test.js
    ├── store/                 ← Zustand: auth, breadcrumb, syllabus
    ├── components/            ← 12 components (Layout, Sidebar, Topbar, AuthGuard, ...)
    └── pages/                 ← 8 pages
```

> **No `src/hooks/` directory exists.** Reusable logic (debounce, RAF counter, SSE pump) is inlined inside components / API modules.

---

## Run & Config

### Scripts (`package.json`)
- `npm run dev` → `vite` (port 5173)
- `npm run build` → `vite build`
- `npm run preview` → `vite preview`
- No `lint` / `test` scripts.

### Environment
| Variable | Required | `.env` | `.env.example` | Notes |
|---|---|---|---|---|
| `VITE_API_URL` | ❌ | `http://localhost:5001` | `http://localhost:5000` ⚠️ | Base URL for API. **Empty string falls back to relative `/api`** (Vite proxy in dev, nginx in prod). `.env.example` has the wrong port; `5001` is correct (matches proxy + nginx). |

### Vite config (`vite.config.js`)
- `@vitejs/plugin-react`.
- Dev server: `port: 5173`, proxy `/api` → `http://localhost:5001` (`changeOrigin: true`, `secure: false`).
- Build: `outDir: 'dist'`, `sourcemap: true`.

### Deployment
- **Vercel** — `vercel.json` rewrites all routes to `/index.html` for client-side routing. Set `VITE_API_URL` to the backend URL.
- **Docker** — 2-stage `Dockerfile`: `node:20-alpine` builds, `nginx:1.25-alpine` serves `dist/`. `nginx.conf` does SPA fallback (`try_files … /index.html`) and proxies `/api/` → `http://backend:5001` (WebSocket upgrade headers included). When `VITE_API_URL` is unset at build time, requests go to relative `/api`.

---

## Routing & Auth

### Route table (`src/App.jsx:15-42`)
| Path | Component | Access |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/signup` | `SignupPage` | Public |
| `/` (parent) | `<AuthGuard><Layout/></AuthGuard>` | Protected |
| `/` (index) | `<Navigate to="/dashboard">` | — |
| `/dashboard` | `DashboardPage` | Protected |
| `/prelims` | `PrelimsPage` | Protected |
| `/test` | `TestPage` | Protected |
| `/notes` | `NotesPage` | Protected |
| `/evaluator` | `EvaluatorPage` | Protected |
| `/history` | `HistoryPage` | Protected |
| `*` | `<Navigate to="/dashboard">` | — |

`Layout` renders `<Sidebar/>`, mobile overlay, `<Topbar/>`, and react-router's `<Outlet/>` for child routes.

### `AuthGuard` (`src/components/AuthGuard.jsx`)
**Presence-only check** — reads `token` from `authStore`; if falsy, `<Navigate to="/login" replace>`. Does **not** call `/auth/me`, does **not** check expiry. A tampered/expired token passes the guard and is only rejected later by the Axios 401 handler (which triggers silent refresh or logout). No role-based access.

---

## API Layer (`src/api/`)

### `axiosInstance.js` — central client + silent refresh
- `BASE_URL = import.meta.env.VITE_API_URL || ''`. Headers: `Content-Type: application/json`, **`timeout: 120000` (120 s)** (AI/RAG calls take 30-60 s on a cold cache).
- **Request interceptor** — injects `Authorization: Bearer <token>` from `useAuthStore.getState().token` if present.
- **Response interceptor — silent token refresh**:
  - Module-level `isRefreshing` flag + `failedQueue` of pending promises. `processQueue(error, token)` resolves/rejects all queued requests.
  - On `401` and `!originalRequest._retry`:
    - If already refreshing → push the request to `failedQueue`; it retries once the new token arrives.
    - Else → set `_retry`, call `POST ${BASE_URL}/api/auth/refresh` with the stored `refreshToken` using **raw `axios.post`** (not the interceptable instance — avoids recursive loops). Reads `data.token || data.accessToken`.
    - On success: `setAuth({token, refreshToken, user})`, `processQueue(null, token)`, retry original.
    - On failure / missing refreshToken: `logout()` + hard redirect to `/login`.

### Modules

**`auth.js`**
```js
signup(data)         // POST /api/auth/signup {name,email,password,targetExam}
login(data)          // POST /api/auth/login  {email,password}
getMe()              // GET  /api/auth/me        ⚠️ DEAD — never imported
refreshToken(token)  // POST /api/auth/refresh   ⚠️ DEAD — interceptor uses raw axios
```
Response: `{ user, token|accessToken, refreshToken }`.

**`prelims.js`**
```js
generatePrelims({topic, exam})  // POST /api/ai/prelims
// Returns array (defensive: r.data is array ? r.data : r.data.questions || [])
```
Each item defensively normalized in the page: `q|question`, `opts|options` (array or `{A,B,C,D}`), `correct|ans|answer|correctAnswer`.

**`notes.js`** — SSE streaming via native `fetch`
```js
streamNotes({topic, exam, noteType}, onChunk, onDone, onError)
// POST /api/ai/notes  → returns an abort function (() => controller.abort())
```
- Uses `fetch` with `signal` for cancellation. Reads `response.body.getReader()` + `TextDecoder('utf-8')`, accumulates a `buffer`, splits on `\n`, keeps the trailing partial line.
- Per-line protocol: skip empty lines and SSE comments (`:`). For `data:` lines:
  - `[DONE]` → `onDone()` and stop.
  - Try `JSON.parse` → extract `parsed.token || parsed.content || parsed.text`; if it throws, pass the raw payload to `onChunk`.
- **AbortError is silently swallowed** — never reaches `onError`.

**`evaluator.js`**
```js
evaluateAnswer({topic, exam, question, answer, marks})  // POST /api/ai/evaluate
// → { score, maxScore, criteria, strengths, improvements, examinerComment, modelAnswer }

extractAnswerFromFile(file)  // POST /api/ai/extract-answer (multipart 'file')
// → { success, text, method, chars }; method ∈ {claude-vision-image, claude-vision-pdf, pdf-text-layer}
```
`extractAnswerFromFile` builds `FormData`, manually sets `Content-Type: multipart/form-data` + Bearer token (bypasses default JSON header).

**`history.js`**
```js
getHistory({page=1, type='all'})  // GET /api/history?page&type   type ∈ {all,prelims,notes,evaluation}
getStats()                        // GET /api/history/stats
getSessionDetail(id)              // GET /api/history/:id   → { success, session }
```

**`syllabus.js`**
```js
getSyllabus(exam)  // GET /api/syllabus?exam=  → nested topic tree
```

**`test.js`** — async job + polling
```js
generateTest({exam, questionCount, durationMinutes, onProgress, onJobCreated})
// POST /api/ai/test/start → {jobId}; then pollTestJob(jobId, onProgress)

pollTestJob(jobId, onProgress)
// GET /api/ai/test/status/:jobId every 1500ms, up to MAX_POLLS=160 (≈4 min cap)
// status 'completed' → return {questions, metadata}; 'failed' → throw
```

---

## State (`src/store/`)

All three use plain `create` from Zustand — **no `persist` middleware**. Auth persistence is manual.

### `authStore.js`
```js
const TOKEN_KEY   = 'examedge_token'
const REFRESH_KEY = 'examedge_refresh_token'
const USER_KEY    = 'examedge_user'

// state: { user, token, refreshToken, isLoading }
// actions:
setAuth({user, token, refreshToken})  // writes all 3 to localStorage
updateUser(user)                       // writes USER_KEY only
logout()                               // clears all 3 keys
setLoading(isLoading)
```
`user`, `token`, `refreshToken` lazy-init from `localStorage` at store creation. `setAuth` tolerates a missing `refreshToken` (keeps the existing one).
**Consumers**: axios instance, AuthGuard, Layout, Sidebar, Topbar, all auth pages + Dashboard/Prelims/Notes/Evaluator/Test.

### `breadcrumbStore.js`
```js
// state: { override }    actions: setOverride(crumbs), clearOverride()
```
`Topbar` reads `override || ROUTE_LABELS[pathname]`. `HistoryPage` sets an override when viewing a session inline.

### `syllabusStore.js`
```js
// state: { topics:{}, loaded:false }
setTopics(examName, topicTree)  // merge + loaded:true
getTopicsForExam(exam)         // topics[exam] || {}
getFlatTopics(exam)            // 'Subject > topic' / 'Subject > Sub > topic' (flat + nested)
reset()
```
Used by `Layout` (preloads all 4 exams on first mount) and `TopicAutocomplete` (filter source).

---

## Components (`src/components/`)

| Component | Props | Notes |
|---|---|---|
| **`AuthGuard`** | `children` | Presence-only token check → `/login`. |
| **`Layout`** | — | `<Sidebar/>` + `<Topbar/>` + `<Outlet/>`. `SIDEBAR_WIDTH=240`. Mobile detection (<768px) auto-collapses sidebar. On mount, if `!syllabusStore.loaded`, fetches syllabus for all 4 exams in parallel (failures swallowed). |
| **`Sidebar`** | `{open, onClose, isMobile}` | Returns `null` if `!open`. `NAV_ITEMS`: Overview (Dashboard), AI Tools (MCQ Prelims `/prelims`, Mock Test `/test`, Mains Notes `/notes`, Answer Evaluator `/evaluator`), Account (Study History `/history`). Avatar = initials from `user.name`. `handleLogout` → `logout()` + navigate `/login`. |
| **`Topbar`** | `{onMenuClick}` | Breadcrumbs via `ROUTE_LABELS` (⚠️ `/test` missing → falls back to `['test']`) or `breadcrumbStore` override. Bell + dropdown with `INITIAL_NOTIFICATIONS` (hardcoded — e.g. "36,526 study chunks loaded"). Outside-click closes dropdown. |
| **`TopicAutocomplete`** | `{value, onChange, exam, placeholder}` | Reads `getFlatTopics`. 200 ms debounce, min 2 chars, max 8 results. Keyboard nav (↑/↓/Enter/Esc). `highlightMatch` wraps matches in `<mark>`. **Free-form entry allowed** — non-syllabus topics still submit. |
| **`MarkdownRenderer`** | `{content}` | `ReactMarkdown` + `remarkGfm` with a large inline-styled `components` map (all colors hardcoded as hex, not Tailwind vars). Tables wrapped in scrollable div; links open in new tab. ⚠️ Uses `inline` prop on `code` — dropped by react-markdown v9. |
| **`MCQCard`** | `{question, options, correctAnswer, explanation, index}` | 4 option buttons (A-D). `handleSelect` locks the card, records selection, auto-reveals explanation after **300 ms**. `isCorrect(i) = i===correctAnswer || options[i]===correctAnswer` (accepts index or value). ⚠️ Once answered, locked; **no score callback** to parent. |
| **`LoadingDots`** | `{message}` | 3 pulsing dots + 192 px shimmer bar. |
| **`StreamingText`** | `{content, isStreaming}` | Display wrapper with blinking cursor. ⚠️ **Unused** — `NotesPage` renders its own inline cursor. |
| **`ScoreRing`** | `{score, maxScore, size=160, strokeWidth=12}` | SVG ring. Color thresholds: `pct≥0.7` green "Excellent", `≥0.5` gold "Good", else red "Needs Work". Animates `strokeDashoffset` after 100 ms. |
| **`RubricBar`** | `{name, weight, score, earned, maxScore, index=0}` | Bar fill animates 0→pct after `200 + index×150` ms. Color: `≥70` green / `≥50` gold / else red. |
| **`SessionDetailModal`** | `{isOpen, onClose, sessionId}` | Loads `getSessionDetail(id)`. Branches on `session.type`: prelims → MCQ grid; notes → MarkdownRenderer; eval → ScoreRing + RubricBars + model answer. Shows amber "Session Data Expired" notice when `metadata` payload is missing. |

---

## Pages (`src/pages/`)

### `LoginPage.jsx` (252 lines)
- Fields: `email`, `password`. `POST /api/auth/login`. On success → `setAuth(...)` + navigate `/dashboard` (replace).
- UX: show/hide password, error banner, loading state, radial-blob background, link to `/signup`.

### `SignupPage.jsx` (330 lines)
- `EXAMS = [APPSC/TGPSC Group 1/2]`. Fields: `name, email, password, targetExam` (default `APPSC Group 1`). Validates name/email-regex/password≥6. `POST /api/auth/signup` → same flow as login.

### `DashboardPage.jsx` (397 lines)
- `Promise.allSettled([getStats(), getHistory({page:1,type:'all'})])`. Defensive reads for both shapes.
- **`AnimatedNumber`** — RAF count-up, 1200 ms ease-out. **`timeAgo`** — Just now / Xm / Xh / Xd.
- 4 stat cards (All Activity / MCQ Practice / Study Notes / Answers Evaluated) → navigate `/history` with `state:{activeTab}`.
- 3 feature cards (MCQ Prelims / Mains Notes / Answer Evaluator) → respective routes. **Mock Test is not surfaced here.**
- Recent activity list → navigate `/history` with `state:{viewSessionId}`.

### `PrelimsPage.jsx` (246 lines)
- Fields: TopicAutocomplete + exam select (default `user.targetExam`). `POST /api/ai/prelims` via `generatePrelims`. Reads `data._fromCache`.
- Renders score-tracker card + Regenerate + 2-col MCQ grid.
- ⚠️ **Score tracker is broken** — `answeredCount`/`correctCount` declared but never updated; `MCQCard` has no callback. Tracker perpetually shows `0 / N`.

### `NotesPage.jsx` (347 lines) — SSE streaming page
- `NOTE_TYPES`: Comprehensive, Quick Revision, Facts & Figures, Current Affairs.
- `handleGenerate` aborts any existing stream, then calls `streamNotes(...)`. `onChunk` appends to `contentRef` + mirrors to state. Stores the returned abort fn in `abortRef`. `handleStop` aborts + marks done.
- UX: topic + exam + note-type toggle + Generate/Stop. While streaming with no content → `LoadingDots`. Output card with "Live"/"Complete" badge, Regenerate + Copy, MarkdownRenderer with **inline blinking cursor** (not `<StreamingText/>`), footer tags (exam, type, word count).

### `EvaluatorPage.jsx` (721 lines) — largest page
- `EXAMS`, `ACCEPTED_TYPES = [jpeg,jpg,png,webp,pdf]`, `MAX_SIZE_MB = 10`, `charLimit = 4000`.
- Form: question, topic (optional), exam, marks (10 or 15), answer.
- **Two answer modes**:
  - **Type** — textarea with char counter (turns gold past 90%).
  - **Upload** — drag-and-drop or click. `processFile` validates type+size, creates object URL for images, calls `extractAnswerFromFile`, fills `form.answer`, sets `extractMeta {method, chars}`. Preview / Re-extract / Remove controls.
- `handleSubmit` validates question + answer (min **30 chars**) → `evaluateAnswer(form)`.
- Results: ScoreRing + examiner comment + RubricBars + Strengths/Improvements lists + Model Answer (MarkdownRenderer). `methodLabel` maps backend `method` values to friendly labels.

### `HistoryPage.jsx` (641 lines)
- Tabs: all / prelims (MCQ Sessions) / notes / evaluation. Source: `?tab=` query → `location.state.activeTab` → `'all'`.
- `fetchHistory`: `getHistory({page,type})`, reads `items || sessions || []`, `totalPages || pages || 1`.
- **Inline session view** (uses `breadcrumbStore` to update Topbar): branches by `type` like `SessionDetailModal`. ⚠️ Code largely duplicated from `SessionDetailModal.jsx`.
- List view: filter tabs, item rows (icon + topic + type badge + exam/score/noteType + timeAgo + formatDate), pagination (up to 5 numbered pages + ellipsis).

### `TestPage.jsx` (982 lines) — full mock-test engine
- **Phases**: `SETUP` → `LOADING` → `TEST` → `RESULTS`.
- **`DURATION_OPTIONS`**: 30 min/50 Q (green), 60 min/100 Q (blue, default), 120 min/200 Q (gold). Maps to backend valid sets `{30,60,120}` × `{50,100,200}`.
- **`normalizeQuestion`** → `{ id, question, options, correct, explanation, difficulty, topic, subject, type }`.
- Sub-components: `SetupScreen`, `LoadingScreen` (progress bar with batch counter), `Timer` (green→gold at ≤5 min→red pulsing at ≤60 s), `QuestionNav` (5-col grid; current=gradient, flagged=gold, answered=green), `ResultsScreen` (`passThreshold = 60%`, score ring, 4-stat grid, inline review).
- **sessionStorage persistence** (`active_test_session`, `active_test_job`): on mount, restores an in-progress test if `targetEndTime - Date.now() > 0`, **or** resumes polling an active generation job. Auto-saves on every state change during TEST phase.
- **Timer effect**: 1-second interval; auto-submits at `secondsLeft ≤ 1`.

---

## Styling System

### `tailwind.config.js`
- `content: ['./index.html', './src/**/*.{js,jsx}']`.
- **Colors** mapped to CSS vars: `bg #0B0F1A`, `surface #131826`, `card #1A2035`, `border #2A3450`, `accent #4F8EF7`, `purple #7B5EF8`, `gold #F5A623`, `green #3DD68C`, `red #F76F6F`, `text #E8EDF8`, `muted #7A8BAA`.
- **Fonts**: `sora` (headings), `sans` (DM Sans body).
- **Animations/keyframes**: `fade-in`, `slide-up`, `pulse-glow`, `spin-slow`, `count-up`.
- **Box-shadow**: `card`, `glow-accent`, `glow-purple`, `glow-gold`, `glow-green`.

### `src/index.css` (~430 lines)
Tailwind directives + hand-rolled dark design system:
- CSS custom properties for colors, fonts (`--font-heading: 'Sora'`, `--font-body: 'DM Sans'`), radii (8/12/16/24px), `--transition: all 0.2s ease`.
- Universal `* { transition: var(--transition) }` (applies to **all** elements globally).
- 6 px custom scrollbars (surface track, accent thumb on hover).
- Utilities: `.glass-card` (rgba(26,32,53,.8) + blur 12 px), `.gradient-text` / `-gold` / `-green` (background-clip text), `.btn-primary` (blue→purple gradient), `.input-field` (focus ring), `.skeleton` (shimmer).
- Keyframes: `fadeIn`, `slideUp`, `slideDown`, `pulseGlow`, `pulseDot`, `shimmer`, `strokeDraw`, `fillBar`, `countUp`, `spin`, `float`.
- `.stagger-children > *:nth-child(n)` delays 0/80/160/240/320/400 ms (6 children max).
- Markdown styles (`.markdown-body ...`) — largely shadowed by `MarkdownRenderer`'s inline styles.
- `[data-tooltip]` pure-CSS tooltip via `::after`.

---

## Streaming & Test Engine Internals

### SSE note streaming (NotesPage)
- Only `/api/ai/notes` streams. Uses native `fetch` + `ReadableStream` reader + manual line parser (see `api/notes.js`).
- Protocol: lines starting with `data:`; `[DONE]` ends the stream; payload is `JSON.parse`d → `token|content|text`, or passed as plain text if parse throws.
- `AbortError` (user cancellation) is swallowed silently.
- ⚠️ The `eventsource-parser` dependency in `package.json` is **never imported** — vestigial.

### Test generation (TestPage)
- **Not SSE** — async job pattern: `POST /api/ai/test/start` → poll `GET /api/ai/test/status/:jobId` every 1.5 s, max 160 polls (~4 min cap) → throws "Test generation timed out."
- `onProgress({progressPct, completedBatches, totalBatches})` drives the `LoadingScreen` bar.
- Job resume on refresh via `sessionStorage.active_test_job`.

### Persistence summary
- **Auth**: manual `localStorage` keys (`examedge_token`, `examedge_refresh_token`, `examedge_user`) inside `authStore`.
- **Test session**: `sessionStorage` (`active_test_session`, `active_test_job`) for crash/refresh recovery.
- Zustand stores themselves are **not** persisted via middleware.

---

## Known Issues, Dead Code & Gotchas

### Broken / partial features
- **`PrelimsPage` score tracker is broken** (`PrelimsPage.jsx:23-29, 175-200`) — `answeredCount`/`correctCount` declared but never updated because `MCQCard` has no `onAnswered` callback. Tracker perpetually shows `0 / N`.
- **`Topbar` `ROUTE_LABELS` omits `/test`** — Mock Test breadcrumb falls back to `['test']` (lowercase, no pretty label).
- **`AuthGuard` does not validate tokens** — any non-empty string passes; enforcement happens server-side via the Axios 401 → refresh flow.
- **`react-markdown` v9 `inline` prop on `code`** (`MarkdownRenderer.jsx:159`) — no longer passed by the library; the inline-vs-block branch may not trigger as intended.

### Dead code / unused exports
- **`api/auth.js`** — `getMe()` and `refreshToken(token)` are exported but **never imported** anywhere. The interceptor calls `/api/auth/refresh` directly via raw axios.
- **`StreamingText.jsx`** — effectively unused; `NotesPage` renders its own inline cursor.
- **`eventsource-parser`** — listed in `package.json` but never imported.
- **`Layout.jsx` reads `user`** but doesn't use it in render.

### Inconsistencies
- **`.env.example` has the wrong port** — says `5000`; should be `5001` (matches `.env`, `vite.config.js` proxy, `nginx.conf`, `docker-compose.staging.yml`).
- **Backend error shape varies** — some handlers return `{error}`, others `{message}`. Pages hedge with `err.response?.data?.message || err.response?.data?.error || err.message`.
- **`index.html` references `/favicon.svg`** but no such file exists in the repo (would 404).
- **Dashboard feature cards omit Mock Test** — only 3 of the 4 AI tools are surfaced.

### Hardcoded values
- 4 exams everywhere: `APPSC Group 1/2`, `TGPSC Group 1/2`.
- Notes types: `Comprehensive`, `Quick Revision`, `Facts & Figures`, `Current Affairs`.
- Evaluator: marks ∈ `{10, 15}`; max upload 10 MB; answer char limit 4000; min answer length 30 chars.
- Test: durations 30/60/120 min ↔ 50/100/200 questions; pass threshold 60%; timer warning at 5 min / 60 s.
- Topbar "36,526 study chunks loaded" notification is hardcoded (not fetched).
- `Sidebar` width 240 px.

### Notes on robustness
- **Token refresh uses raw `axios.post`** (not the `api` instance) to avoid re-triggering the interceptor recursively — intentional and correct.
- **`Layout.jsx` fetches all 4 syllabi** on first protected-page mount, guarded by `syllabusStore.loaded` so it runs once per session; failures swallowed.
- **`MCQCard` option correctness** accepts either an index OR a value string (`i === correctAnswer || options[i] === correctAnswer`) — defensive against inconsistent API shapes.
- **No tests, no linter config, no CI** in the frontend.
