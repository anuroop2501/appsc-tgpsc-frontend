# ExamEdge — Frontend Architecture & Codebase Guide

> **Stack**: React 18.3 (SPA) • Vite 5.4 • Tailwind CSS 3.4 • Zustand 4.5 • React Router DOM 6.26 • Axios 1.7  
> **Target Audience**: APPSC & TGPSC (Group 1 & Group 2) Aspirants  
> **Supported Languages**: English (`en`) & Telugu (`te` — ప్రామాణిక తెలుగు మాధ్యమం)  
> **Theme**: Adaptive Dark/Light Mode with custom examination styling

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Complete Directory Hierarchy](#2-complete-directory-hierarchy)
3. [Core Flow & State Management](#3-core-flow--state-management)
4. [API & Data Layer (`src/api/`)](#4-api--data-layer-srcapi)
5. [UI Components Hierarchy (`src/components/`)](#5-ui-components-hierarchy-srccomponents)
6. [Pages & Routing (`src/pages/`)](#6-pages--routing-srcpages)
7. [Design System & Responsive Architecture](#7-design-system--responsive-architecture)
8. [Internationalization (`en` / `te`)](#8-internationalization-en--te)
9. [Build, Config & Deployment](#9-build-config--deployment)

---

## 1. High-Level Architecture

```
                                  ┌──────────────────────────────┐
                                  │      index.html / main.jsx   │
                                  └──────────────┬───────────────┘
                                                 │
                                  ┌──────────────▼───────────────┐
                                  │           App.jsx            │
                                  │ (Routes, Theme & Lang Provs) │
                                  └──────────────┬───────────────┘
                                                 │
                  ┌──────────────────────────────┴──────────────────────────────┐
                  │                                                             │
   ┌──────────────▼──────────────┐                               ┌──────────────▼──────────────┐
   │         Public Routes       │                               │       Protected Routes      │
   │  /login, /signup, /pricing  │                               │    <AuthGuard><Layout /></> │
   │  /privacy, /terms, /refund  │                               └──────────────┬──────────────┘
   └─────────────────────────────┘                                              │
                                                 ┌──────────────────────────────┴──────────────────────────────┐
                                                 │                                                             │
                                  ┌──────────────▼──────────────┐                               ┌──────────────▼──────────────┐
                                  │      Sidebar & Topbar       │                               │      Feature Pages (SPA)    │
                                  │ (Nav, Credits, Avatar, Lang)│                               │ Dashboard, Prelims, Notes,  │
                                  └─────────────────────────────┘                               │ Evaluator, Planner, History │
                                                                                                └──────────────┬──────────────┘
                                                                                                               │
                                                                                                ┌──────────────▼──────────────┐
                                                                                                │      API Client Layer       │
                                                                                                │  Axios + SSE Stream Pumps   │
                                                                                                └──────────────┬──────────────┘
                                                                                                               │ (HTTP / SSE)
                                                                                                ┌──────────────▼──────────────┐
                                                                                                │   ExamEdge Express Backend  │
                                                                                                │       (:5001 /api/*)        │
                                                                                                └─────────────────────────────┘
```

---

## 2. Complete Directory Hierarchy

```
frontend/
├── index.html                     # Entry HTML, SEO meta, Google Fonts (Sora & DM Sans)
├── package.json                   # Dependencies (React, Vite, Lucide, Tailwind, Zustand)
├── vite.config.js                 # Vite build & dev proxy (/api -> http://localhost:5001)
├── tailwind.config.js             # Theme tokens, font families, custom keyframe animations
├── postcss.config.js              # PostCSS plugin config (Tailwind + Autoprefixer)
├── nginx.conf                     # Production Nginx reverse-proxy & SPA catch-all config
├── vercel.json                    # Vercel SPA routing rewrite rules
├── Dockerfile                     # Multi-stage production build (Node -> Nginx Alpine)
├── .env / .env.example            # Environment variables (VITE_API_URL, Sentry DSN)
└── src/
    ├── main.jsx                   # React root mount with ErrorBoundary
    ├── App.jsx                    # Top-level Router, Route guards, Theme/Language providers
    ├── index.css                  # Global design system, CSS variables, mobile utilities
    │
    ├── api/                       # Backend HTTP client & SSE streaming endpoints
    │   ├── axiosInstance.js       # Central Axios client with auto-refresh JWT token queue
    │   ├── auth.js                # Login, signup, me, refresh, logout API calls
    │   ├── prelims.js             # MCQ generation & progressive batch streaming API
    │   ├── notes.js               # SSE notes generator stream reader
    │   ├── evaluator.js           # Mains answer evaluation & OCR extraction API
    │   ├── planner.js / test.js   # Study timetable & full mock test suite API
    │   ├── history.js             # User activity logs, stats, and session persistence API
    │   ├── syllabus.js            # APPSC/TGPSC official syllabus tree endpoints
    │   └── payment.js             # Razorpay order creation, payment verification & plans
    │
    ├── context/                   # Global React contexts
    │   ├── LanguageContext.jsx    # English ('en') vs Telugu ('te') language state & switcher
    │   └── ThemeContext.jsx       # Dark / Light theme state & DOM class toggle
    │
    ├── store/                     # Zustand state management stores
    │   ├── authStore.js           # User profile, tokens, credit balance, plan tier
    │   ├── breadcrumbStore.js     # Dynamic page header titles & navigation breadcrumbs
    │   └── syllabusStore.js       # Cached subject/topic taxonomy for APPSC/TGPSC
    │
    ├── locales/                   # Translations & localized UI strings
    │   └── translations.js        # Comprehensive English & Telugu UI dictionaries
    │
    ├── lib/                       # Utility libraries
    │   ├── exportPdf.js           # Clean PDF generation with custom styling & formatting
    │   └── sentry.js              # Frontend error tracking & monitoring initialization
    │
    ├── components/                # Reusable UI components
    │   ├── Layout.jsx             # Authenticated shell layout (Sidebar + Topbar + Content)
    │   ├── Sidebar.jsx            # Desktop collapsible sidebar + mobile full drawer
    │   ├── Topbar.jsx             # Header with title, credit pill, language, and mobile avatar menu
    │   ├── AuthGuard.jsx          # Route protector ensuring active authentication
    │   ├── MCQCard.jsx            # Interactive MCQ card with timer, options, and 360° explanation
    │   ├── FormattedQuestionText.jsx # Renders Match-the-Following tables & Statement questions
    │   ├── ScoreRing.jsx          # Animated SVG score progress ring for test results
    │   ├── RubricBar.jsx          # Mains evaluation 5-point criteria progress bars
    │   ├── StreamingText.jsx      # Live streaming markdown typing renderer
    │   ├── MarkdownRenderer.jsx   # GitHub-flavored markdown renderer with syntax highlighting
    │   ├── TopicAutocomplete.jsx  # Live search & autocomplete for syllabus topics
    │   ├── PricingModal.jsx       # Credit top-up & plan upgrade modal
    │   ├── SessionDetailModal.jsx # Detailed modal for reviewing past study sessions
    │   ├── LegalLayout.jsx        # Standard container for legal policy pages
    │   ├── BrandLogo.jsx          # ExamEdge brand SVG icon & typography
    │   ├── LoadingDots.jsx        # Subtle animated loading indicator
    │   └── Footer.jsx             # Footer with copyright & legal links
    │
    └── pages/                     # Application page views
        ├── DashboardPage.jsx      # Hub: greeting, quick stats, resume study, feature shortcuts
        ├── PrelimsPage.jsx        # Prelims MCQ practice engine (progressive streaming & scoring)
        ├── NotesPage.jsx          # AI Smart Notes generator with SSE streaming & PDF export
        ├── EvaluatorPage.jsx      # Mains Answer Evaluator (OCR upload, scoring, rubric, model answer)
        ├── PlannerPage.jsx        # Smart Study Timetable Generator (custom schedules & milestones)
        ├── HistoryPage.jsx        # Activity timeline, performance statistics & revision bank
        ├── PricingPage.jsx        # Full pricing matrix, credit packs, and subscription tiers
        ├── LoginPage.jsx          # Sign in page with email/password and demo mode
        ├── SignupPage.jsx         # Sign up with exam selection (APPSC / TGPSC)
        ├── PrivacyPolicyPage.jsx  # Privacy policy document
        ├── TermsConditionsPage.jsx# Terms and conditions document
        └── RefundPolicyPage.jsx   # Cancellation and refund policy document
```

---

## 3. Core Flow & State Management

### 3.1 Authentication & AuthStore (`src/store/authStore.js`)
- Stores: `user`, `accessToken`, `refreshToken`, `credits`, `planTier`.
- Persistence: Access token and refresh token are synced with `localStorage`.
- Initialization: On app load, `authStore.initAuth()` restores tokens and calls `/api/auth/me` to refresh user details and credit balance.
- Silent Token Refresh: `axiosInstance.js` catches `401 Unauthorized` responses and silently requests a new access token via `/api/auth/refresh`, queuing concurrent requests and retrying them seamlessly.

### 3.2 Breadcrumb & Header Store (`src/store/breadcrumbStore.js`)
- Manages dynamic page titles, action buttons, and navigation breadcrumbs rendered in `Topbar.jsx`.

### 3.3 Language Context (`src/context/LanguageContext.jsx`)
- Supports `'en'` (English) and `'te'` (Telugu).
- Persisted in `localStorage.getItem('app_language')`.
- All static strings are mapped via `locales/translations.js`.
- Selected language is automatically sent in request payloads (`{ language: 'te' }`) to prompt the backend for Telugu-medium content.

---

## 4. API & Data Layer (`src/api/`)

| File | Purpose | Protocol / Endpoints |
|---|---|---|
| `axiosInstance.js` | Axios singleton with base URL, bearer interceptor, and 401 retry queue | HTTP / Axios |
| `auth.js` | Login, signup, me, refresh token, password reset | `POST /api/auth/*` |
| `prelims.js` | Generates 10-question MCQ prelims batches via Server-Sent Events | `POST /api/ai/prelims` (SSE) |
| `notes.js` | Streams comprehensive notes via chunked SSE reader | `POST /api/ai/notes` (SSE) |
| `evaluator.js` | Uploads handwritten answer images for OCR & generates Mains rubric evaluation | `POST /api/ai/evaluate`, `POST /api/ai/extract-answer` |
| `payment.js` | Razorpay order creation and payment verification | `POST /api/payment/*` |
| `history.js` | Fetches user activity logs, aggregate test stats, and stored session details | `GET /api/history/*` |
| `syllabus.js` | Fetches APPSC & TGPSC syllabus hierarchies | `GET /api/syllabus` |

---

## 5. UI Components Hierarchy (`src/components/`)

### 5.1 Global Shell
- **`Layout.jsx`**: Main authenticated shell. Renders `Sidebar` (left) and `Topbar` + dynamic `<Outlet />` (right). Uses responsive fluid padding (`isMobile ? '18px 14px' : '32px 36px'`).
- **`Sidebar.jsx`**:
  - **Desktop**: Sleek collapsible sidebar with logo, navigation links, exam badge, and active state indicators.
  - **Mobile**: Full-height slide-out drawer with backdrop blur and auto-close on navigation.
- **`Topbar.jsx`**:
  - **Desktop**: Full page title, compact credit balance pill (`[ ⚡ 11.9k Top up ]`), language switcher (`EN / TE`), theme toggle, notification bell, and user avatar.
  - **Mobile (< 768px)**: Decluttered layout. One-tap credit badge directly opens `PricingModal`. Secondary controls (Language, Theme, Plans, Sign Out) are consolidated into a clean, tap-friendly Avatar dropdown menu.

### 5.2 Interactive Question & Study Components
- **`MCQCard.jsx`**: Interactive card supporting:
  - Question timer and difficulty badge (`Medium` / `Hard`).
  - Option selector with instant feedback (correct: green, incorrect: red).
  - 360° detailed explanation toggle with distractor breakdowns and key memory hooks.
  - Clean PDF download integration.
- **`FormattedQuestionText.jsx`**: Automatically parses and structures special MCQ formats:
  - **Match the Following**: Renders a clean, side-by-side 2-column table comparing List-I and List-II.
  - **Statement Questions**: Renders numbered statements (1, 2, 3...) in distinct highlight boxes.
  - **Assertion-Reasoning**: Highlights Assertion (A) and Reason (R) in dedicated callout blocks.
- **`ScoreRing.jsx`**: Animated SVG circular progress bar displaying test accuracy, score, and completion speed.
- **`RubricBar.jsx`**: Visual 5-point bar breakdown for Mains evaluation (Introduction, Context, Analysis, State Relevance, Conclusion).
- **`PricingModal.jsx`**: In-app modal for instant credit top-up and subscription plan upgrades.

---

## 6. Pages & Routing (`src/pages/`)

### Route Map
```
/login                     → LoginPage.jsx (Public)
/signup                    → SignupPage.jsx (Public)
/pricing                   → PricingPage.jsx (Public/Protected)
/privacy, /terms, /refund  → Policy Pages (Public)

/                          → DashboardPage.jsx (Protected)
/prelims                   → PrelimsPage.jsx (Protected)
/notes                     → NotesPage.jsx (Protected)
/evaluator                 → EvaluatorPage.jsx (Protected, PRO Tier)
/planner                   → PlannerPage.jsx (Protected)
/history                   → HistoryPage.jsx (Protected)
```

### Page Capabilities:
1. **`DashboardPage.jsx`**:
   - Personalized greeting with active exam badge (APPSC/TGPSC Group 1 or 2).
   - Metrics grid: Total questions solved, accuracy rate, study streak, notes generated.
   - Quick launcher for Prelims MCQ, Notes, Evaluator, and Timetable Planner.
2. **`PrelimsPage.jsx`**:
   - Real-time syllabus topic search with autocomplete.
   - Live SSE progress bar displaying retrieval, batch generation, and evaluator audit stages.
   - 2-column responsive MCQ grid rendering 10 questions with progressive delivery.
   - Final score summary modal with accuracy analysis.
3. **`NotesPage.jsx`**:
   - Note formats: `Comprehensive (1500w)`, `Revision Points`, `Comparative Table`, `Mindmap Outline`.
   - Live typewriter streaming of markdown content.
   - Single-click PDF export with clean formatting.
4. **`EvaluatorPage.jsx`**:
   - Drag-and-drop answer sheet image upload with live OCR extraction.
   - 5-criteria grading rubric, examiner remarks, structural improvements, and benchmark model answer.
5. **`PlannerPage.jsx`**:
   - Target exam date picker and daily study hour selection.
   - Generates multi-week study timetables with milestone dates and subject allocations.
6. **`HistoryPage.jsx`**:
   - Filterable timeline of all past study sessions (Prelims tests, generated notes, Mains evaluations).
   - Re-open past sessions in `SessionDetailModal` with full question reviews.

---

## 7. Design System & Responsive Architecture

### 7.1 Color Tokens & Theme (`src/index.css` & `tailwind.config.js`)
- **Dark Theme Palette**:
  - Background: `#0B0F1A` / Surface: `#111827` / Border: `#1F2937`
  - Accent Primary: `#4F8EF7` (Electric Blue)
  - Accent Secondary: `#7B5EF8` (Royal Purple)
  - Success: `#3DD68C` / Warning: `#F5A623` / Error: `#F76F6F`
- **Light Theme Palette**:
  - Background: `#F8FAFC` / Surface: `#FFFFFF` / Border: `#E2E8F0`

### 7.2 Mobile Responsiveness System
- **Breakpoint Scale**: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.
- **Touch Ergonomics**: All interactive elements (buttons, chips, inputs, options) enforce a minimum 44px touch height (`min-h-[44px]`).
- **Responsive Tables**: All generated timetable and comparison tables are wrapped in `overflow-x: auto` with webkit-momentum scrolling.
- **Fluid Layout Padding**: Main content containers adapt dynamically from 14px padding on mobile to 40px on widescreen monitors.

---

## 8. Internationalization (`en` / `te`)

- **Bilingual Interface**: Full localization support for English and Telugu.
- **Standard Academic Telugu**: UI and prompt configurations enforce official APPSC/TGPSC terminology (ప్రామాణిక తెలుగు).
- **Dynamic Font Rendering**: Seamless rendering of Telugu Unicode fonts alongside English typography.

---

## 9. Build, Config & Deployment

### Commands
```bash
# Install dependencies
npm install

# Start local development server on port 5173
npm run dev

# Build production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables (`.env`)
```env
# Backend API Base URL
VITE_API_URL=http://localhost:5001

# Sentry Error Tracking DSN (Optional)
VITE_SENTRY_DSN=
```
